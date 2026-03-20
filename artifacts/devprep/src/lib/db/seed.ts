import type { ContentRecord } from './sql'

export interface SeedQuestion {
  id: string
  channel_id: string
  content_type: 'question'
  data: string
  quality_score: number
  embedding_id: string | null
  created_at: number
  updated_at: number
  status: string
  generated_by: string | null
  generation_time_ms: number | null
}

export interface SeedFlashcard {
  id: string
  channel_id: string
  content_type: 'flashcard'
  data: string
  quality_score: number
  embedding_id: string | null
  created_at: number
  updated_at: number
  status: string
  generated_by: string | null
  generation_time_ms: number | null
}

export interface SeedExam {
  id: string
  channel_id: string
  content_type: 'exam'
  data: string
  quality_score: number
  embedding_id: string | null
  created_at: number
  updated_at: number
  status: string
  generated_by: string | null
  generation_time_ms: number | null
}

export interface SeedVoice {
  id: string
  channel_id: string
  content_type: 'voice'
  data: string
  quality_score: number
  embedding_id: string | null
  created_at: number
  updated_at: number
  status: string
  generated_by: string | null
  generation_time_ms: number | null
}

export interface SeedCoding {
  id: string
  channel_id: string
  content_type: 'coding'
  data: string
  quality_score: number
  embedding_id: string | null
  created_at: number
  updated_at: number
  status: string
  generated_by: string | null
  generation_time_ms: number | null
}

export type SeedRecord = SeedQuestion | SeedFlashcard | SeedExam | SeedVoice | SeedCoding

export interface SeedData {
  questions: SeedQuestion[]
  flashcards: SeedFlashcard[]
  exams: SeedExam[]
  voices: SeedVoice[]
  codings: SeedCoding[]
}

export function getDefaultSeedData(): SeedData {
  const now = Math.floor(Date.now() / 1000)

  return {
    questions: [
      {
        id: 'q-devops-001',
        channel_id: 'devops',
        content_type: 'question',
        data: JSON.stringify({
          title: 'What is Docker and how does it differ from virtual machines?',
          tags: ['devops', 'docker', 'containers'],
          difficulty: 'intermediate',
          sections: [
            {
              type: 'short',
              content:
                'Docker is a containerization platform that packages applications and their dependencies into containers. Unlike VMs, containers share the host OS kernel, making them lightweight and fast to start.',
            },
            {
              type: 'code',
              language: 'bash',
              content: 'docker run -d nginx:latest',
            },
          ],
        }),
        quality_score: 0.95,
        embedding_id: null,
        created_at: now,
        updated_at: now,
        status: 'completed',
        generated_by: 'gpt-4',
        generation_time_ms: 1500,
      },
      {
        id: 'q-devops-002',
        channel_id: 'devops',
        content_type: 'question',
        data: JSON.stringify({
          title: 'Explain CI/CD pipeline and its stages',
          tags: ['devops', 'ci-cd', 'automation'],
          difficulty: 'intermediate',
          sections: [
            {
              type: 'short',
              content:
                'CI/CD automates the software delivery process. CI continuously integrates code changes, while CD automates delivery to production.',
            },
          ],
        }),
        quality_score: 0.92,
        embedding_id: null,
        created_at: now - 3600,
        updated_at: now - 3600,
        status: 'completed',
        generated_by: 'gpt-4',
        generation_time_ms: 1200,
      },
    ],
    flashcards: [
      {
        id: 'fc-devops-001',
        channel_id: 'devops',
        content_type: 'flashcard',
        data: JSON.stringify({
          front: 'What is Kubernetes?',
          back: 'A container orchestration platform for automating deployment, scaling, and management of containerized applications.',
          tags: ['devops', 'kubernetes', 'orchestration'],
        }),
        quality_score: 0.9,
        embedding_id: null,
        created_at: now - 7200,
        updated_at: now - 7200,
        status: 'completed',
        generated_by: 'gpt-4',
        generation_time_ms: 800,
      },
      {
        id: 'fc-devops-002',
        channel_id: 'devops',
        content_type: 'flashcard',
        data: JSON.stringify({
          front: 'What is GitOps?',
          back: 'A methodology that uses Git as the single source of truth for infrastructure and application deployments.',
          tags: ['devops', 'gitops', 'git'],
        }),
        quality_score: 0.88,
        embedding_id: null,
        created_at: now - 10800,
        updated_at: now - 10800,
        status: 'completed',
        generated_by: 'gpt-4',
        generation_time_ms: 750,
      },
    ],
    exams: [],
    voices: [],
    codings: [],
  }
}

export function getAllSeedRecords(): SeedRecord[] {
  const seedData = getDefaultSeedData()
  return [
    ...seedData.questions,
    ...seedData.flashcards,
    ...seedData.exams,
    ...seedData.voices,
    ...seedData.codings,
  ]
}

export function getSeedRecords(): SeedRecord[] {
  const seedData = getDefaultSeedData()
  return [
    ...seedData.questions,
    ...seedData.flashcards,
    ...seedData.exams,
    ...seedData.voices,
    ...seedData.codings,
  ]
}
