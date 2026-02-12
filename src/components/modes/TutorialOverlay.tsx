import { useSettingsStore } from '@/stores/settingsStore.js';
import { TUTORIAL_STEPS } from '@/utils/constants.js';
import Button from '@/components/shared/Button.js';

export default function TutorialOverlay() {
  const showTutorial = useSettingsStore(s => s.showTutorial);
  const step = useSettingsStore(s => s.tutorialStep);
  const setStep = useSettingsStore(s => s.setTutorialStep);
  const setShowTutorial = useSettingsStore(s => s.setShowTutorial);

  if (!showTutorial) return null;

  const currentStep = TUTORIAL_STEPS[step];
  if (!currentStep) return null;

  const isFirst = step === 0;
  const isLast = step === TUTORIAL_STEPS.length - 1;
  const hasHighlight = !!currentStep.highlight;

  return (
    <div className={`tutorial-overlay ${hasHighlight ? 'tutorial-overlay--has-highlight' : ''}`}>
      <div className="tutorial-card">
        <div className="tutorial-card__step">
          Step {step + 1} of {TUTORIAL_STEPS.length}
        </div>
        <div className="tutorial-card__title">{currentStep.title}</div>
        <div className="tutorial-card__text">{currentStep.description}</div>
        <div className="tutorial-card__actions">
          <div>
            {!isFirst && (
              <Button variant="secondary" size="small" onClick={() => setStep(step - 1)}>
                Back
              </Button>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="secondary" size="small" onClick={() => setShowTutorial(false)}>
              Skip
            </Button>
            {isLast ? (
              <Button variant="gold" size="small" onClick={() => setShowTutorial(false)}>
                Done
              </Button>
            ) : (
              <Button variant="primary" size="small" onClick={() => setStep(step + 1)}>
                Next
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
