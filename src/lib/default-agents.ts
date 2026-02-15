/**
 * Default agent templates with HeyGen avatar configurations
 */

export interface DefaultAgentTemplate {
  id: string;
  name: string;
  description: string;
  heygen: {
    avatar_id: string;
    voice_id: string;
    voice_name: string;
    preview_url: string;
  };
}

export const DEFAULT_AGENT_TEMPLATES: DefaultAgentTemplate[] = [
  {
    id: "dexter-lawyer",
    name: "Dexter Lawyer",
    description: "Seasoned professional lawyer. Methodical, detail-oriented, and authoritative. Grounded in case law and legal precedent.",
    heygen: {
      avatar_id: "0930fd59-c8ad-434d-ad53-b391a1768720",
      voice_id: "b952f553-f7f3-4e52-8625-86b4c415384f",
      voice_name: "Dexter - Professional",
      preview_url: "https://files2.heygen.ai/avatar/v3/e20ac0c902184ff793e75ae4e139b7dc_45600/preview_target.webp"
    }
  },
  {
    id: "judy-lawyer-professional",
    name: "Judy Lawyer",
    description: "Experienced legal professional. Thorough analysis with balanced perspective. Makes complex topics accessible.",
    heygen: {
      avatar_id: "6e32f90a-f566-45be-9ec7-a5f6999ee606",
      voice_id: "4f3b1e99-b580-4f05-9b67-a5f585be0232",
      voice_name: "Judy - Professional",
      preview_url: "https://files2.heygen.ai/avatar/v3/a7c86cb77b3144948bf8020f6e734bbf_45640/preview_talk_1.webp"
    }
  },
  {
    id: "young-passionate-lawyer",
    name: "Alex Young",
    description: "Passionate young lawyer. Brings fresh perspectives, challenges conventions, and advocates for innovative solutions.",
    heygen: {
      avatar_id: "6e32f90a-f566-45be-9ec7-a5f6999ee606",
      voice_id: "4f3b1e99-b580-4f05-9b67-a5f585be0232",
      voice_name: "Judy - Professional",
      preview_url: "https://files2.heygen.ai/avatar/v3/a7c86cb77b3144948bf8020f6e734bbf_45640/preview_talk_1.webp"
    }
  }
];
