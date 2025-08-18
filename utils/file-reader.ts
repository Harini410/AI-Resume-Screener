export interface ResumeFile {
  id: string
  name: string
  content: string
  filePath: string
}

export interface JobDescriptionFile {
  id: string
  name: string
  content: string
  filePath: string
}

// Simulate file system reading for demo purposes
export async function getResumeFiles(): Promise<ResumeFile[]> {
  const resumeFiles = [
    {
      id: "john_doe",
      name: "John Doe - Software Engineer",
      filePath: "/data/resumes/john_doe_software_engineer.txt",
      content: await fetch("/data/resumes/john_doe_software_engineer.txt")
        .then((r) => r.text())
        .catch(() => ""),
    },
    {
      id: "sarah_smith",
      name: "Sarah Smith - Data Scientist",
      filePath: "/data/resumes/sarah_smith_data_scientist.txt",
      content: await fetch("/data/resumes/sarah_smith_data_scientist.txt")
        .then((r) => r.text())
        .catch(() => ""),
    },
    {
      id: "mike_johnson",
      name: "Mike Johnson - Product Manager",
      filePath: "/data/resumes/mike_johnson_product_manager.txt",
      content: await fetch("/data/resumes/mike_johnson_product_manager.txt")
        .then((r) => r.text())
        .catch(() => ""),
    },
  ]

  return resumeFiles
}

export async function getJobDescriptionFiles(): Promise<JobDescriptionFile[]> {
  const jdFiles = [
    {
      id: "software_engineer",
      name: "Software Engineer - Full Stack Developer",
      filePath: "/data/jds/software_engineer_job.txt",
      content: await fetch("/data/jds/software_engineer_job.txt")
        .then((r) => r.text())
        .catch(() => ""),
    },
    {
      id: "data_scientist",
      name: "Senior Data Scientist",
      filePath: "/data/jds/data_scientist_job.txt",
      content: await fetch("/data/jds/data_scientist_job.txt")
        .then((r) => r.text())
        .catch(() => ""),
    },
    {
      id: "product_manager",
      name: "Senior Product Manager",
      filePath: "/data/jds/product_manager_job.txt",
      content: await fetch("/data/jds/product_manager_job.txt")
        .then((r) => r.text())
        .catch(() => ""),
    },
  ]

  return jdFiles
}

export async function readResumeFile(filePath: string): Promise<string> {
  try {
    const response = await fetch(filePath)
    return await response.text()
  } catch (error) {
    console.error("Error reading resume file:", error)
    return ""
  }
}

export async function readJobDescriptionFile(filePath: string): Promise<string> {
  try {
    const response = await fetch(filePath)
    return await response.text()
  } catch (error) {
    console.error("Error reading job description file:", error)
    return ""
  }
}
