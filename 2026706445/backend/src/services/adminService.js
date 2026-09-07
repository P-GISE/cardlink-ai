import { badRequest, notFound } from "../utils/httpErrors.js";

const orderStatusLabels = {
  payment_pending: "결제대기",
  production_pending: "제작대기",
  preparing: "준비중",
  printing: "인쇄중",
  printed: "인쇄완료",
  shipping: "배송중",
  completed: "완료",
  cancelled: "취소"
};

const requestStatusLabels = {
  pending: "대기",
  approved: "승인",
  accepted: "승인",
  rejected: "거절",
  withdrawn: "철회"
};

const auditActionLabels = {
  member_publication_updated: "회원 공개 상태 변경",
  physical_card_order_status_updated: "실물명함 주문 상태 변경"
};

const readTable = async (supabase, tableName) => {
  const { data, error } = await supabase.from(tableName).select("*");

  if (error) throw error;

  return data || [];
};

const countBy = (items, getKey) =>
  Object.entries(
    items.reduce((result, item) => {
      const key = getKey(item) || "unknown";
      result[key] = (result[key] || 0) + 1;
      return result;
    }, {})
  ).map(([key, value]) => ({ key, value }));

const byId = (items) => new Map(items.map((item) => [item.id, item]));

const toMember = (profile) => ({
  id: profile.id,
  userId: profile.user_id,
  slug: profile.slug,
  displayName: profile.display_name,
  email: profile.email,
  role: profile.role,
  headline: profile.headline,
  isPublished: Boolean(profile.is_published),
  status: profile.is_published ? "published" : "hidden",
  hasProfile: Boolean(profile.id),
  createdAt: profile.created_at,
  updatedAt: profile.updated_at
});

const toContactRequest = (request, profiles) => {
  const requester = profiles.get(request.requester_profile_id);
  const target = profiles.get(request.target_profile_id);

  return {
    id: request.id,
    kind: "컨택",
    source: "contact_request",
    title: target?.display_name || "알 수 없는 프로필",
    requester: requester?.display_name || "알 수 없는 요청자",
    target: target?.display_name || "알 수 없는 대상",
    status: request.status,
    statusLabel: requestStatusLabels[request.status] || request.status,
    message: request.message,
    createdAt: request.created_at,
    updatedAt: request.updated_at
  };
};

const toProjectApplication = (application, profiles, projects) => {
  const applicant = profiles.get(application.applicant_profile_id);
  const project = projects.get(application.project_id);

  return {
    id: application.id,
    kind: "참가",
    source: "project_application",
    title: project?.title || "알 수 없는 프로젝트",
    requester: applicant?.display_name || "알 수 없는 지원자",
    target: project?.title || "알 수 없는 프로젝트",
    status: application.status,
    statusLabel: requestStatusLabels[application.status] || application.status,
    message: application.message,
    createdAt: application.created_at,
    updatedAt: application.updated_at
  };
};

const sortNewestFirst = (items) =>
  [...items].sort((left, right) => String(right.createdAt || "").localeCompare(String(left.createdAt || "")));

const parseMetadata = (metadata) => {
  if (!metadata) return {};
  if (typeof metadata === "string") {
    try {
      return JSON.parse(metadata);
    } catch {
      return {};
    }
  }
  return metadata;
};

const toStoredAuditLog = (row) => {
  const metadata = parseMetadata(row.metadata);
  const status =
    metadata.status ||
    (typeof metadata.isPublished === "boolean" ? (metadata.isPublished ? "published" : "hidden") : undefined);

  return {
    id: row.id,
    action: auditActionLabels[row.action] || row.action,
    actionKey: row.action,
    actor: row.actor_email || row.actor_user_id || "관리자",
    target: row.target_label || row.target_id,
    targetType: row.target_type,
    targetId: row.target_id,
    status,
    statusLabel: metadata.statusLabel || requestStatusLabels[status] || orderStatusLabels[status] || status,
    metadata,
    createdAt: row.created_at
  };
};

const buildOperationLogs = ({ contactRequests, projectApplications, physicalCardOrders, profiles, projects }) => {
  const profileMap = byId(profiles);
  const projectMap = byId(projects);

  const contactLogs = contactRequests.map((request) => {
    const requester = profileMap.get(request.requester_profile_id);
    const target = profileMap.get(request.target_profile_id);

    return {
      id: `contact-${request.id}`,
      action: "컨택 요청 접수",
      actor: requester?.display_name || "알 수 없는 요청자",
      target: target?.display_name || "알 수 없는 프로필",
      status: request.status,
      statusLabel: requestStatusLabels[request.status] || request.status,
      createdAt: request.created_at
    };
  });

  const applicationLogs = projectApplications.map((application) => {
    const applicant = profileMap.get(application.applicant_profile_id);
    const project = projectMap.get(application.project_id);

    return {
      id: `application-${application.id}`,
      action: "프로젝트 참가 신청",
      actor: applicant?.display_name || "알 수 없는 지원자",
      target: project?.title || "알 수 없는 프로젝트",
      status: application.status,
      statusLabel: requestStatusLabels[application.status] || application.status,
      createdAt: application.created_at
    };
  });

  const orderLogs = physicalCardOrders.map((order) => {
    const profile = profileMap.get(order.profile_id);

    return {
      id: `order-${order.id}`,
      action: "실물 명함 주문 접수",
      actor: order.recipient_name || profile?.display_name || "알 수 없는 주문자",
      target: profile?.display_name || order.profile_id,
      status: order.status,
      statusLabel: orderStatusLabels[order.status] || order.status,
      createdAt: order.created_at
    };
  });

  return sortNewestFirst([...orderLogs, ...applicationLogs, ...contactLogs]);
};

const createAuditLogRow = (adminUser, event) => ({
  actor_user_id: adminUser.id,
  actor_email: adminUser.email || null,
  action: event.action,
  target_type: event.targetType,
  target_id: event.targetId,
  target_label: event.targetLabel || null,
  metadata: event.metadata || {}
});

export const createAdminService = (supabase) => {
  const loadAdminData = async () => {
    const [profiles, projects, contactRequests, projectApplications, physicalCardOrders, adminAuditLogs] =
      await Promise.all([
        readTable(supabase, "profiles"),
        readTable(supabase, "projects"),
        readTable(supabase, "contact_requests"),
        readTable(supabase, "project_applications"),
        readTable(supabase, "physical_card_orders"),
        readTable(supabase, "admin_audit_logs")
      ]);

    return {
      profiles,
      projects,
      contactRequests,
      projectApplications,
      physicalCardOrders,
      adminAuditLogs
    };
  };

  const logAdminAction = async (adminUser, event) => {
    const { data, error } = await supabase
      .from("admin_audit_logs")
      .insert(createAuditLogRow(adminUser, event))
      .select()
      .single();

    if (error) throw error;

    return toStoredAuditLog(data);
  };

  return {
    logAdminAction,

    async getOverview() {
      const data = await loadAdminData();
      const activeOrders = data.physicalCardOrders.filter(
        (order) => !["completed", "cancelled"].includes(order.status)
      );
      const recentAuditLogs = data.adminAuditLogs.map(toStoredAuditLog);

      return {
        cards: [
          { key: "members", label: "회원/프로필", value: data.profiles.length },
          {
            key: "publishedProfiles",
            label: "공개 전자명함",
            value: data.profiles.filter((profile) => profile.is_published).length
          },
          {
            key: "pendingContacts",
            label: "대기 컨택 요청",
            value: data.contactRequests.filter((request) => request.status === "pending").length
          },
          {
            key: "pendingApplications",
            label: "대기 참가 신청",
            value: data.projectApplications.filter((application) => application.status === "pending").length
          },
          { key: "activeOrders", label: "진행 중 주문", value: activeOrders.length }
        ],
        orderStatus: countBy(data.physicalCardOrders, (order) => order.status).map((item) => ({
          ...item,
          label: orderStatusLabels[item.key] || item.key
        })),
        requestStatus: [
          ...countBy(data.contactRequests, (request) => request.status).map((item) => ({
            ...item,
            kind: "컨택",
            label: requestStatusLabels[item.key] || item.key
          })),
          ...countBy(data.projectApplications, (application) => application.status).map((item) => ({
            ...item,
            kind: "참가",
            label: requestStatusLabels[item.key] || item.key
          }))
        ],
        recentActivity: sortNewestFirst([...recentAuditLogs, ...buildOperationLogs(data)]).slice(0, 8)
      };
    },

    async listMembers() {
      const profiles = await readTable(supabase, "profiles");
      const items = sortNewestFirst(profiles.map(toMember));

      return {
        count: items.length,
        items
      };
    },

    async updateMemberPublication(adminUser, profileId, payload = {}) {
      if (typeof payload.isPublished !== "boolean") {
        throw badRequest("isPublished must be a boolean.");
      }

      const { data, error } = await supabase
        .from("profiles")
        .update({
          is_published: payload.isPublished,
          updated_at: new Date().toISOString()
        })
        .eq("id", profileId)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw notFound("Member profile not found.");

      const member = toMember(data);
      const status = member.isPublished ? "published" : "hidden";

      await logAdminAction(adminUser, {
        action: "member_publication_updated",
        targetType: "profile",
        targetId: member.id,
        targetLabel: member.displayName || member.slug,
        metadata: {
          isPublished: member.isPublished,
          status,
          statusLabel: member.isPublished ? "공개" : "숨김"
        }
      });

      return member;
    },

    async listRequests() {
      const data = await loadAdminData();
      const profileMap = byId(data.profiles);
      const projectMap = byId(data.projects);
      const items = sortNewestFirst([
        ...data.contactRequests.map((request) => toContactRequest(request, profileMap)),
        ...data.projectApplications.map((application) => toProjectApplication(application, profileMap, projectMap))
      ]);

      return {
        count: items.length,
        items
      };
    },

    async listAuditLogs() {
      const data = await loadAdminData();
      const storedAuditLogs = data.adminAuditLogs.map(toStoredAuditLog);
      const items = sortNewestFirst([...storedAuditLogs, ...buildOperationLogs(data)]);

      return {
        count: items.length,
        items
      };
    }
  };
};
