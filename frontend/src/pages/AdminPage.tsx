import { useState } from 'react'
import { Layout } from '../components/layout/Layout'
import { AdminStepper, type AdminStep } from '../components/admin/AdminStepper'
import { ClassificationStep } from '../components/admin/steps/ClassificationStep'
import { AssignClassificationsStep } from '../components/admin/steps/AssignClassificationsStep'
import { PatternRecognitionStep } from '../components/admin/steps/PatternRecognitionStep'
import { MigrationsStep } from '../components/admin/steps/MigrationsStep'
import { LoadDataStep } from '../components/admin/steps/LoadDataStep'
import { useGetClassifications } from '../hooks/classification.hooks'
import { useGetAllFiles } from '../hooks/files.hooks'
import { useGetAllExtractedFiles } from '../hooks/extractedFile.hooks'
import { useGetRelationships } from '../hooks/patternRecognition.hooks'
import {
  useListMigrations,
  useLoadData,
  useGetConnectionUrl,
} from '../hooks/migrations.hooks'

export function AdminPage() {
  const [activeStep, setActiveStep] = useState(0)

  const { classifications } = useGetClassifications()
  const { files } = useGetAllFiles()
  const { extractedFiles } = useGetAllExtractedFiles()
  const { relationships } = useGetRelationships()
  const { migrations } = useListMigrations()
  const { loadDataResponse } = useLoadData()
  const { connectionUrl } = useGetConnectionUrl()

  const hasClassifications = (classifications?.length ?? 0) > 0
  const totalFiles = files?.length ?? 0
  const classifiedFiles =
    files?.filter(f => f.classification && f.classification !== 'Unclassified')
      .length ?? 0
  const hasExtractedFiles =
    extractedFiles?.some(ef => ef.status === 'completed') ?? false
  const hasRelationships = (relationships?.length ?? 0) > 0
  const hasMigrations = (migrations?.length ?? 0) > 0
  const hasConnectionUrl = !!connectionUrl
  const hasDataLoaded = !!loadDataResponse || hasConnectionUrl

  const step1Complete = hasClassifications
  const step2Complete = step1Complete && totalFiles > 0 && classifiedFiles > 0
  const step3Complete = hasRelationships
  const step4Complete = hasMigrations
  const step5Complete = hasDataLoaded

  const steps: AdminStep[] = [
    {
      label: 'Create Classifications',
      status: step1Complete
        ? 'completed'
        : activeStep === 0
          ? 'current'
          : 'pending',
    },
    {
      label: 'Assign Classifications',
      status: step2Complete
        ? 'completed'
        : step1Complete
          ? 'pending'
          : 'disabled',
    },
    {
      label: 'Recognize Patterns',
      status: step3Complete
        ? 'completed'
        : step2Complete
          ? 'pending'
          : 'disabled',
    },
    {
      label: 'Generate Migrations',
      status: step4Complete
        ? 'completed'
        : step3Complete
          ? 'pending'
          : 'disabled',
    },
    {
      label: 'Load Data & Get Connection URL',
      status: step5Complete
        ? 'completed'
        : activeStep === 4
          ? 'current'
          : step4Complete
            ? 'pending'
            : 'disabled',
    },
  ]

  const canGoNext =
    (activeStep === 0 && step1Complete && hasExtractedFiles) ||
    (activeStep === 1 && step2Complete) ||
    (activeStep === 2 && step3Complete) ||
    activeStep === 3 ||
    (activeStep === 4 && step5Complete)

  const handleNext = () => {
    if (canGoNext && activeStep < steps.length - 1) {
      setActiveStep(prev => prev + 1)
    }
  }

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(prev => prev - 1)
    }
  }

  return (
    <Layout>
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex-shrink-0 mb-4">
          <AdminStepper
            steps={steps}
            onStepClick={index => {
              const step = steps[index]
              if (step.status !== 'disabled') {
                setActiveStep(index)
              }
            }}
          />
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-4">
          {activeStep === 0 && <ClassificationStep />}
          {activeStep === 1 && <AssignClassificationsStep />}
          {activeStep === 2 && <PatternRecognitionStep />}
          {activeStep === 3 && <MigrationsStep />}
          {activeStep === 4 && <LoadDataStep />}
        </div>

        <div className="flex-shrink-0 mt-4 flex items-center justify-between">
          <button
            type="button"
            onClick={handleBack}
            disabled={activeStep === 0}
            className="text-sm text-slate-400 disabled:text-slate-600"
          >
            Back
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={!canGoNext || activeStep === steps.length - 1}
            className="rounded-md bg-primary-600 hover:bg-primary-700 px-4 py-2 text-sm font-medium text-white disabled:bg-slate-700 disabled:text-slate-400 transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </Layout>
  )
}
