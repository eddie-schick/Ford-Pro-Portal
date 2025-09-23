import { Button } from '@/components/ui/button'

export function StickyActions({
  onBack,
  onContinue,
  backLabel = 'Back',
  continueLabel = 'Continue',
  disableBack = false,
  disableContinue = false,
  showBack = true,
  showContinue = true,
  className = ''
}) {
  return (
    <div className={`fixed bottom-0 left-0 right-0 z-40 bg-white border-t shadow-lg ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          {showBack ? (
            <Button
              variant="outline"
              onClick={onBack}
              disabled={disableBack}
              className="flex items-center gap-2"
            >
              {backLabel}
            </Button>
          ) : (
            <div />
          )}
          
          {showContinue && (
            <Button
              onClick={onContinue}
              disabled={disableContinue}
              className="flex items-center gap-2"
            >
              {continueLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
