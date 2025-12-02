import type { FC } from 'react'
import { Button } from '../../ui/Button'
import { ErrorAlert } from '../../ui/ErrorAlert'
import {
  useAnalyzeRelationships,
  useGetRelationships,
} from '../../../hooks/patternRecognition.hooks'

interface PatternRecognitionStepProps {
  onCompleted?: () => void
}

export const PatternRecognitionStep: FC<PatternRecognitionStepProps> = ({
  onCompleted,
}) => {
  const {
    relationships,
    relationshipsIsLoading,
    relationshipsError: loadError,
  } = useGetRelationships()
  const {
    analyzeRelationships,
    isAnalyzingRelationships,
    analyzeRelationshipsError,
  } = useAnalyzeRelationships()

  const handleAnalyze = async () => {
    await analyzeRelationships()
    onCompleted?.()
  }

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-100">
            Recognize patterns between classifications
          </h2>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Analyze your classified documents to infer relationships
            (one-to-one, one-to-many, many-to-many) between classifications.
          </p>
        </div>
        <Button onClick={handleAnalyze} loading={isAnalyzingRelationships}>
          Analyze patterns
        </Button>
      </div>

      {analyzeRelationshipsError && (
        <ErrorAlert
          error={analyzeRelationshipsError}
          title="Failed to analyze relationships"
        />
      )}
      {loadError && (
        <ErrorAlert
          error={loadError}
          title="Failed to load existing relationships"
        />
      )}

      {relationshipsIsLoading ? (
        <div className="text-center py-10 text-slate-400">
          Loading relationships...
        </div>
      ) : relationships.length === 0 ? (
        <div className="text-center py-10 text-slate-400">
          No relationships found yet. Run pattern recognition to infer them from
          your data.
        </div>
      ) : (
        <div className="space-y-2">
          {relationships.map(rel => (
            <div
              key={rel.relationship_id}
              className="flex items-center justify-between px-4 py-3 rounded-lg bg-slate-750 border border-slate-700"
            >
              <div className="flex items-center gap-2 text-sm text-slate-100">
                <span className="font-medium">
                  {rel.from_classification.name}
                </span>
                <span className="text-slate-500">→</span>
                <span className="font-medium">
                  {rel.to_classification.name}
                </span>
              </div>
              <span className="px-2 py-0.5 text-xs rounded-full bg-slate-700 text-slate-200">
                {rel.type}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
