export const SITE = {
  name: "Assignment Assist",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://assignmentassist.com",
  whatsapp: "923177507779",
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "hello@example.com",
  replyTime: "30 minutes", // keep this honest: only promise what you can deliver
};

export const SUBJECTS = [
  "Business & Management", "Accounting & Finance", "Economics", "Computer Science & IT",
  "Engineering", "Mathematics & Statistics", "Nursing & Health", "Law",
  "Psychology & Social Sciences", "English & Literature", "Education", "Other",
];

// Replace the placeholders with real reviews (only ones students agreed to share).
export const REVIEWS = [
  { placeholder: true }, { placeholder: true }, { placeholder: true },
  // { quote: "...", name: "Aisha K.", detail: "BBA student" },
];

export const FAQS = [
  { q: "Do you write my assignment for me?",
    a: "No. We coach you through your own assignment: we explain the task, help you plan, give feedback on your drafts and show worked examples. You write and submit your own work." },
  { q: "How fast can I get help?",
    a: `Message us on WhatsApp or email. We usually reply within ${SITE.replyTime}. If your deadline is close, say so in your message.` },
  { q: "What can I send you?",
    a: "Your assignment brief, your draft or notes, and the topic you are stuck on. You can upload a file in the request form." },
  { q: "Can you check my draft?",
    a: "Yes. We review structure, clarity, grammar and referencing, and explain what to improve so you can fix it yourself." },
  { q: "Is my information private?",
    a: "Yes. Files you upload are stored privately and only used to help you with your request." },
];
