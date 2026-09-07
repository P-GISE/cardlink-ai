import { profile, projects, recommendations } from "../data/mockData.js";

const now = "2026-05-21T00:00:00.000Z";

const localProfile = {
  id: "profile-demo",
  user_id: "demo-owner",
  slug: "minjun",
  display_name: profile.name,
  role: profile.role,
  headline: profile.headline,
  bio: profile.aiSummary,
  location: profile.location,
  avatar_url: null,
  organization: "CardLink Studio",
  position: "Founder",
  phone: "010-0000-0000",
  website_url: "https://cardlink.example.test",
  business_address: "서울",
  card_tagline: "QR로 연결되는 전자명함",
  email: profile.contact.email,
  github_url: profile.contact.github,
  portfolio_url: profile.contact.portfolio,
  contact_policy: "approval_required",
  is_published: true,
  created_at: now,
  updated_at: now,
  skills: profile.skills,
  interests: profile.interests,
  projects: profile.projects,
  contact: profile.contact
};

const recommendedProfiles = recommendations.map((recommendation, index) => ({
  id: `profile-recommendation-${index + 1}`,
  user_id: `recommendation-user-${index + 1}`,
  slug: recommendation.slug,
  display_name: recommendation.name,
  role: recommendation.role,
  headline: recommendation.headline,
  bio: recommendation.reason,
  location: "서울",
  avatar_url: null,
  organization: null,
  position: recommendation.role,
  phone: null,
  website_url: null,
  business_address: null,
  card_tagline: "CardLink 추천 프로필",
  email: recommendation.contact,
  github_url: null,
  portfolio_url: null,
  contact_policy: index === 0 ? "instant" : "approval_required",
  is_published: true,
  created_at: new Date(Date.parse(now) + index + 100).toISOString(),
  updated_at: new Date(Date.parse(now) + index + 100).toISOString(),
  skills: recommendation.skills,
  interests: recommendation.interests,
  projects: [],
  contact: {
    email: recommendation.contact
  }
}));

const initialTables = () => ({
  profiles: [localProfile, ...recommendedProfiles],
  projects: projects.map((project, index) => ({
    id: project.id,
    title: project.title,
    description: project.description,
    status: project.status,
    deadline: project.deadline,
    is_published: true,
    owner_profile_id: localProfile.id,
    profiles: {
      display_name: localProfile.display_name,
      slug: localProfile.slug
    },
    roles: project.roles,
    skills: project.skills,
    interests: project.interests,
    created_at: new Date(Date.parse(now) + index).toISOString(),
    updated_at: new Date(Date.parse(now) + index).toISOString()
  })),
  project_roles: projects.flatMap((project) =>
    (project.roles || []).map((name, index) => ({
      id: `${project.id}-role-${index + 1}`,
      project_id: project.id,
      name,
      created_at: now,
      updated_at: now
    }))
  ),
  project_skills: projects.flatMap((project) =>
    (project.skills || []).map((name, index) => ({
      id: `${project.id}-skill-${index + 1}`,
      project_id: project.id,
      name,
      created_at: now,
      updated_at: now
    }))
  ),
  project_interests: projects.flatMap((project) =>
    (project.interests || []).map((name, index) => ({
      id: `${project.id}-interest-${index + 1}`,
      project_id: project.id,
      name,
      created_at: now,
      updated_at: now
    }))
  ),
  project_applications: [],
  contact_requests: [],
  physical_card_orders: [],
  admin_audit_logs: [],
  recommendation_runs: [],
  recommendations: []
});

class LocalQuery {
  constructor(tables, tableName) {
    this.tables = tables;
    this.tableName = tableName;
    this.filters = [];
    this.orderBy = null;
    this.limitCount = null;
    this.insertPayload = null;
    this.updatePayload = null;
    this.upsertPayload = null;
    this.deletePayload = false;
  }

  select() {
    return this;
  }

  eq(column, value) {
    this.filters.push({ type: "eq", column, value });
    return this;
  }

  neq(column, value) {
    this.filters.push({ type: "neq", column, value });
    return this;
  }

  in(column, values = []) {
    this.filters.push({ type: "in", column, values });
    return this;
  }

  order(column, options = {}) {
    this.orderBy = { column, ascending: Boolean(options.ascending) };
    return this;
  }

  limit(value) {
    this.limitCount = value;
    return this;
  }

  insert(payload) {
    this.insertPayload = payload;
    return this;
  }

  update(payload) {
    this.updatePayload = payload;
    return this;
  }

  upsert(payload) {
    this.upsertPayload = payload;
    return this;
  }

  delete() {
    this.deletePayload = true;
    return this;
  }

  async single() {
    const { data, error } = await this.execute();
    if (error) return { data: null, error };
    return { data: Array.isArray(data) ? data[0] || null : data, error: null };
  }

  async maybeSingle() {
    return this.single();
  }

  then(resolve, reject) {
    return this.execute().then(resolve, reject);
  }

  async execute() {
    if (this.deletePayload) {
      const rowsToDelete = this.readRows({ hydrate: false });
      this.tables[this.tableName] = this.tables[this.tableName].filter((row) => !rowsToDelete.includes(row));
      return { data: rowsToDelete, error: null };
    }

    if (this.insertPayload) {
      const rows = Array.isArray(this.insertPayload) ? this.insertPayload : [this.insertPayload];
      const inserted = rows.map((row, index) => ({
        id: row.id || `${this.tableName}-${this.tables[this.tableName].length + index + 1}`,
        created_at: row.created_at || now,
        updated_at: row.updated_at || now,
        ...row
      }));
      this.tables[this.tableName].push(...inserted);
      return { data: Array.isArray(this.insertPayload) ? inserted : inserted[0], error: null };
    }

    if (this.upsertPayload) {
      const row = {
        id: this.upsertPayload.id || `${this.tableName}-${this.tables[this.tableName].length + 1}`,
        created_at: this.upsertPayload.created_at || now,
        updated_at: now,
        ...this.upsertPayload
      };
      const index = this.tables[this.tableName].findIndex(
        (item) => item.id === row.id || (row.user_id && item.user_id === row.user_id)
      );
      if (index >= 0) {
        this.tables[this.tableName][index] = { ...this.tables[this.tableName][index], ...row };
        return { data: this.tables[this.tableName][index], error: null };
      }
      this.tables[this.tableName].push(row);
      return { data: row, error: null };
    }

    if (this.updatePayload) {
      const rows = this.readRows({ hydrate: false }).map((row) => {
        Object.assign(row, this.updatePayload, { updated_at: now });
        return row;
      });
      return { data: rows, error: null };
    }

    return { data: this.readRows(), error: null };
  }

  readRows({ hydrate = true } = {}) {
    let rows = [...this.tables[this.tableName]];

    this.filters.forEach((filter) => {
      if (filter.type === "eq") {
        rows = rows.filter((row) => row[filter.column] === filter.value);
      }
      if (filter.type === "neq") {
        rows = rows.filter((row) => row[filter.column] !== filter.value);
      }
      if (filter.type === "in") {
        rows = rows.filter((row) => filter.values.includes(row[filter.column]));
      }
    });

    if (this.orderBy) {
      const direction = this.orderBy.ascending ? 1 : -1;
      rows.sort((left, right) => {
        const leftValue = left[this.orderBy.column] || "";
        const rightValue = right[this.orderBy.column] || "";
        return String(leftValue).localeCompare(String(rightValue)) * direction;
      });
    }

    if (this.limitCount !== null) {
      rows = rows.slice(0, this.limitCount);
    }

    if (hydrate && this.tableName === "profiles") {
      rows = rows.map((row) => ({
        ...row,
        profile_skills: this.tables.profile_skills?.filter((skill) => skill.profile_id === row.id) || [],
        profile_interests:
          this.tables.profile_interests?.filter((interest) => interest.profile_id === row.id) || [],
        profile_projects: this.tables.profile_projects?.filter((project) => project.profile_id === row.id) || []
      }));
    }

    if (hydrate && this.tableName === "projects") {
      rows = rows.map((row) => {
        const owner = this.tables.profiles?.find((profile) => profile.id === row.owner_profile_id);

        return {
          ...row,
          profiles: row.profiles || (owner ? { display_name: owner.display_name, slug: owner.slug } : null),
          project_roles:
            row.project_roles || this.tables.project_roles?.filter((role) => role.project_id === row.id) || [],
          project_skills:
            row.project_skills || this.tables.project_skills?.filter((skill) => skill.project_id === row.id) || [],
          project_interests:
            row.project_interests ||
            this.tables.project_interests?.filter((interest) => interest.project_id === row.id) ||
            []
        };
      });
    }

    return rows;
  }
}

export const createLocalSupabaseServiceClient = () => {
  const tables = initialTables();

  return {
    from(tableName) {
      if (!tables[tableName]) {
        tables[tableName] = [];
      }
      return new LocalQuery(tables, tableName);
    }
  };
};

export const createLocalSupabaseAuthClient = () => ({
  auth: {
    getUser: async (token) =>
      token === "local-admin-token"
        ? {
            data: {
              user: {
                id: "local-admin",
                email: "admin@example.test",
                app_metadata: { role: "admin" }
              }
            },
            error: null
          }
        : token
        ? {
            data: { user: { id: "local-user", email: "local@example.test", app_metadata: {} } },
            error: null
          }
        : {
            data: { user: null },
            error: null
          }
  }
});

export const publicRecommendations = recommendations;
