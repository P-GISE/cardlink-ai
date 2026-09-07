export const profile = {
  id: "user-001",
  name: "김민준",
  role: "프론트엔드 개발자 지망생",
  headline: "사용자 경험을 데이터와 인터랙션으로 개선하는 개발자",
  location: "서울",
  aiSummary:
    "AI가 정리한 소개문: 김민준님은 Vue 기반 웹 서비스 개발 경험과 협업 프로젝트 경험을 갖춘 프론트엔드 개발자입니다. 사용자 흐름을 이해하고, 빠르게 시제품을 만들며, 팀과 명확하게 소통하는 강점이 있습니다.",
  skills: ["Vue", "JavaScript", "Node.js", "Express", "Figma", "Git"],
  interests: ["프론트엔드", "AI 서비스", "커뮤니티", "취업 포트폴리오"],
  projects: [
    {
      name: "캠퍼스 일정 공유 서비스",
      description: "학과 행사와 스터디 일정을 한곳에서 확인하는 Vue 기반 웹앱",
      period: "2025.09 - 2025.12"
    },
    {
      name: "AI 자기소개서 피드백 도구",
      description: "mock AI 응답을 활용해 자기소개서 문장을 개선하는 과제 프로젝트",
      period: "2026.03 - 2026.05"
    }
  ],
  contact: {
    email: "minjun.kim@example.com",
    github: "https://github.com/minjun-kim",
    portfolio: "https://portfolio.example.com/minjun"
  },
  shareUrl: "https://cardlink.example.com/u/minjun"
};

export const projects = [
  {
    id: "project-001",
    title: "AI 전자명함 추천 알고리즘 고도화",
    description:
      "사용자 기술 스택과 관심 분야를 기반으로 협업 상대를 추천하는 규칙 기반 추천 기능을 함께 개선합니다.",
    roles: ["프론트엔드", "백엔드", "기획"],
    skills: ["Vue", "Node.js", "Express"],
    interests: ["AI 서비스", "커뮤니티"],
    owner: "커넥트랩",
    deadline: "2026-06-15",
    status: "모집중"
  },
  {
    id: "project-002",
    title: "캠퍼스 팀빌딩 커뮤니티",
    description:
      "졸업작품, 공모전, 스터디 팀원을 모집하고 지원 현황을 확인하는 커뮤니티 기능을 제작합니다.",
    roles: ["UI 디자이너", "프론트엔드", "QA"],
    skills: ["Vue", "Figma", "JavaScript"],
    interests: ["커뮤니티", "협업"],
    owner: "대학생연합개발팀",
    deadline: "2026-06-30",
    status: "모집중"
  },
  {
    id: "project-003",
    title: "취업 포트폴리오 자동 정리 도구",
    description:
      "프로젝트 경험을 입력하면 포트폴리오 문장과 기술 태그를 자동으로 정리해주는 웹 서비스를 만듭니다.",
    roles: ["백엔드", "콘텐츠 기획", "프론트엔드"],
    skills: ["Node.js", "Express", "JavaScript"],
    interests: ["취업 포트폴리오", "AI 서비스"],
    owner: "잡브릿지",
    deadline: "2026-07-05",
    status: "모집중"
  },
  {
    id: "project-004",
    title: "QR 기반 네트워킹 이벤트 페이지",
    description:
      "행사장에서 QR 링크로 전자명함을 공유하고 관심 프로젝트를 바로 확인하는 이벤트 페이지를 구현합니다.",
    roles: ["프론트엔드", "운영", "디자이너"],
    skills: ["Vue", "CSS", "Figma"],
    interests: ["네트워킹", "프론트엔드"],
    owner: "캠퍼스커넥트",
    deadline: "2026-07-20",
    status: "모집중"
  },
  {
    id: "project-005",
    title: "협업 평판 대시보드",
    description:
      "팀 프로젝트 이후 동료 피드백을 시각화해 다음 협업 기회로 연결하는 대시보드를 설계합니다.",
    roles: ["프론트엔드", "데이터 분석", "기획"],
    skills: ["Vue", "JavaScript", "Chart.js"],
    interests: ["협업", "데이터 시각화"],
    owner: "프로젝트허브",
    deadline: "2026-08-01",
    status: "기획중"
  }
];

export const recommendations = [
  {
    id: "rec-001",
    slug: "seoyeon-lee",
    name: "이서연",
    role: "UI/UX 디자이너",
    headline: "사용자 리서치와 서비스 플로우 설계에 강한 디자이너",
    skills: ["Figma", "프로토타이핑", "UX 리서치"],
    interests: ["커뮤니티", "AI 서비스"],
    matchScore: 94,
    reason: "Vue 프로젝트와 AI 서비스 관심사가 비슷하며, UI 설계 역량이 프론트엔드 개발과 잘 맞습니다.",
    contact: "seoyeon.lee@example.com"
  },
  {
    id: "rec-002",
    slug: "jihoon-park",
    name: "박지훈",
    role: "백엔드 개발자",
    headline: "Node.js 기반 API 설계와 배포 경험이 있는 개발자",
    skills: ["Node.js", "Express", "REST API", "AWS"],
    interests: ["협업", "취업 포트폴리오"],
    matchScore: 89,
    reason: "Express 경험이 많고, 전자명함 서비스의 API 구조를 함께 발전시키기 좋습니다.",
    contact: "jihoon.park@example.com"
  },
  {
    id: "rec-003",
    slug: "harin-jung",
    name: "정하린",
    role: "서비스 기획자",
    headline: "문제 정의와 발표 자료 구성이 강한 프로젝트 리더",
    skills: ["서비스 기획", "데이터 분석", "Notion"],
    interests: ["네트워킹", "커뮤니티"],
    matchScore: 86,
    reason: "네트워킹이 실제 협업으로 이어지는 서비스 문제의식이 비슷해 기획 협업에 적합합니다.",
    contact: "harin.jung@example.com"
  }
];
