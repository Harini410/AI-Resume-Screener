const COMMON_SKILLS = [
  // Programming Languages
  "JavaScript",
  "TypeScript",
  "Python",
  "Java",
  "C++",
  "C#",
  "PHP",
  "Ruby",
  "Go",
  "Rust",
  "Swift",
  "Kotlin",
  "Scala",
  "R",
  "MATLAB",
  "SQL",
  "HTML",
  "CSS",

  // Frameworks & Libraries
  "React",
  "Angular",
  "Vue",
  "Node.js",
  "Express",
  "Django",
  "Flask",
  "Spring",
  "Laravel",
  "Rails",
  "Next.js",
  "Nuxt.js",
  "Svelte",
  "jQuery",
  "Bootstrap",
  "Tailwind",

  // Databases
  "MySQL",
  "PostgreSQL",
  "MongoDB",
  "Redis",
  "SQLite",
  "Oracle",
  "Cassandra",
  "DynamoDB",

  // Cloud & DevOps
  "AWS",
  "Azure",
  "GCP",
  "Docker",
  "Kubernetes",
  "Jenkins",
  "GitLab",
  "GitHub Actions",
  "Terraform",
  "Ansible",
  "Chef",
  "Puppet",

  // Tools & Technologies
  "Git",
  "Linux",
  "Unix",
  "Bash",
  "PowerShell",
  "Webpack",
  "Vite",
  "ESLint",
  "Prettier",
  "Jest",
  "Cypress",
  "Selenium",
  "Postman",
  "Figma",
  "Adobe",
  "Sketch",

  // Methodologies
  "Agile",
  "Scrum",
  "Kanban",
  "DevOps",
  "CI/CD",
  "TDD",
  "BDD",
  "Microservices",
  "REST",
  "GraphQL",
]

export function extractSkills(text: string): string[] {
  const normalizedText = text.toLowerCase()
  const foundSkills = new Set<string>()

  COMMON_SKILLS.forEach((skill) => {
    const skillLower = skill.toLowerCase()
    const escapedSkill = skillLower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

    // Check for exact matches and common variations
    const patterns = [
      new RegExp(`\\b${escapedSkill}\\b`, "i"),
      new RegExp(`\\b${escapedSkill}\\.js\\b`, "i"), // For .js frameworks
      new RegExp(`\\b${escapedSkill}js\\b`, "i"), // For reactjs, vuejs etc
    ]

    if (patterns.some((pattern) => pattern.test(normalizedText))) {
      foundSkills.add(skill)
    }
  })

  return Array.from(foundSkills)
}

export function findMissingSkills(resumeSkills: string[], jobSkills: string[]): string[] {
  const resumeSkillsLower = resumeSkills.map((skill) => skill.toLowerCase())
  return jobSkills.filter((jobSkill) => !resumeSkillsLower.includes(jobSkill.toLowerCase()))
}

export function findMatchingSkills(resumeSkills: string[], jobSkills: string[]): string[] {
  const jobSkillsLower = jobSkills.map((skill) => skill.toLowerCase())
  return resumeSkills.filter((resumeSkill) => jobSkillsLower.includes(resumeSkill.toLowerCase()))
}

export function calculateBasicMatchScore(resumeSkills: string[], jobSkills: string[]): number {
  if (jobSkills.length === 0) return 0

  const matchingSkills = findMatchingSkills(resumeSkills, jobSkills)
  return Math.round((matchingSkills.length / jobSkills.length) * 100)
}
