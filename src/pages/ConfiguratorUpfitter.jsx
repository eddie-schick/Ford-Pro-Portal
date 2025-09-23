import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Stepper } from '@/components/Stepper'
import { UpfitterPicker } from '@/components/UpfitterPicker'
import { LivePricingSidebar } from '@/components/LivePricingSidebar'
import { StickyActions } from '@/components/Layout/StickyActions'
import { 
  loadConfiguration, 
  saveConfiguration, 
  validateStep,
  parseQueryToConfig,
  configToQuery,
  isDemoMode
} from '@/lib/configurationStore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function ConfiguratorUpfitter() {
  const navigate = useNavigate()
  const location = useLocation()
  const [configuration, setConfiguration] = useState(() => {
    const params = new URLSearchParams(location.search)
    if (params.toString()) {
      return parseQueryToConfig(params)
    }
    return loadConfiguration()
  })

  // Always position view at top on step entry
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  // Redirect if prerequisites not met
  useEffect(() => {
    if (!isDemoMode() && (!configuration.bodyType || !configuration.chassis?.series || !configuration.bodySpecs)) {
      navigate('/configurator/chassis-selection')
    }
  }, [configuration, navigate])

  // Update URL when configuration changes
  useEffect(() => {
    const query = configToQuery(configuration)
    const newUrl = `${location.pathname}?${query}`
    window.history.replaceState(null, '', newUrl)
  }, [configuration, location.pathname])

  const handleUpfitterChange = (upfitter) => {
    const updated = {
      ...configuration,
      upfitter: upfitter
    }
    setConfiguration(updated)
    saveConfiguration(updated)
  }

  const handleBack = () => {
    navigate('/configurator/body-specs?' + configToQuery(configuration))
  }

  const handleContinue = () => {
    if (isDemoMode() || validateStep(5, configuration)) {
      const updated = {
        ...configuration,
        completedSteps: [...new Set([...configuration.completedSteps, 5])]
      }
      saveConfiguration(updated)
      navigate('/configurator/pricing?' + configToQuery(updated))
    }
  }

  const isValid = isDemoMode() || !!configuration.upfitter

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <Stepper currentStep={5} completedSteps={configuration.completedSteps} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Main Content */}
          <div className="flex-1">
            <Card>
              <CardHeader>
                <CardTitle>Step 5: Select Upfitter/Installer</CardTitle>
                <CardDescription>
                  Find a qualified upfitter to install your {configuration.bodyType} on the {configuration.chassis?.series}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UpfitterPicker
                  initialUpfitter={configuration.upfitter}
                  onChange={handleUpfitterChange}
                  chassisSeries={configuration.chassis?.series}
                  bodyType={configuration.bodyType}
                />
              </CardContent>
            </Card>
          </div>

          {/* Live Pricing Sidebar */}
          <LivePricingSidebar configuration={configuration} />
        </div>
      </div>

      <StickyActions
        onBack={handleBack}
        onContinue={handleContinue}
        disableContinue={!isValid}
        continueLabel="Continue to Pricing"
      />
    </div>
  )
}
