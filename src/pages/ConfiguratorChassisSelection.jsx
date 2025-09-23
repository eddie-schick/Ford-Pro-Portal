import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Stepper } from '@/components/Stepper'
import { LivePricingSidebar } from '@/components/LivePricingSidebar'
import { CompletedUnitsGallery } from '@/components/CompletedUnitsGallery'
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
import { Button } from '@/components/ui/button'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import { Badge } from '@/components/ui/badge'
import { Circle, Truck } from 'lucide-react'
import { getChassis } from '@/api/routes'

const CHASSIS_CATALOG = [
  { id: 'f350', name: 'Chassis Cab F-350 XL (2025)', series: 'F-350', class: 'Class 3', gvwr: '12,000–14,000 lbs', description: 'Popular for municipal fleets, trades, and lighter vocational upfits.', imageKey: 'F-350' },
  { id: 'f450', name: 'Chassis Cab F-450 XL (2025)', series: 'F-450', class: 'Class 4', gvwr: '14,000–16,500 lbs', description: 'More payload/towing than F-350 while staying maneuverable.', imageKey: 'F-450' },
  { id: 'f550', name: 'Chassis Cab F-550 XL (2025)', series: 'F-550', class: 'Class 5', gvwr: '17,500–19,500 lbs', description: 'Workhorse for utilities, construction, and municipalities.', imageKey: 'F-550' },
  { id: 'f600', name: 'Chassis Cab F-600 XL (2025)', series: 'F-600', class: 'Class 6', gvwr: '22,000 lbs', description: 'Bridges gap between Super Duty and true Medium Duty.', imageKey: 'F-600' },
  { id: 'f650', name: 'F-650 SD Straight Frame (2025)', series: 'F-650', class: 'Class 6/7', gvwr: '25,600–29,000 lbs', description: 'For heavier regional delivery, construction, and municipal operations.', imageKey: 'F-650' },
  { id: 'f750', name: 'F-750 SD Straight Frame (2025)', series: 'F-750', class: 'Class 7', gvwr: 'Up to 37,000 lbs', description: 'Heavy vocational use and long-haul vocational fleets.', imageKey: 'F-750' },
  { id: 'e350', name: 'E-Series Cutaway E-350 (2025)', series: 'E-350', class: 'Class 3', gvwr: '10,050–12,700 lbs', description: 'Versatile cutaway platform for box and utility bodies.', imageKey: 'E-350' },
  { id: 'e450', name: 'E-Series Cutaway E-450 (2025)', series: 'E-450', class: 'Class 4', gvwr: 'Up to 14,500 lbs', description: 'Higher GVWR cutaway ideal for delivery and service applications.', imageKey: 'E-450' }
]

function ChassisSelectionCard({ chassis, selected, onSelect }) {
  const [imgIdx, setImgIdx] = useState(0)
  const candidateSources = [
    `/vehicle-images/${chassis.imageKey}.avif`,
    `/vehicle-images/${chassis.imageKey}.png`,
    `/vehicle-images/${chassis.imageKey}.jpg`,
    `/vehicle-images/${chassis.imageKey}.webp`
  ]

  return (
    <Card 
      className={`hover:shadow-lg transition-shadow cursor-pointer ${
        selected ? 'ring-2 ring-blue-600 bg-blue-50' : ''
      }`}
      onClick={() => onSelect(chassis)}
    >
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          {chassis.name}
          {selected && <Badge className="bg-blue-600">Selected</Badge>}
        </CardTitle>
        <CardDescription>
          {chassis.class} • GVWR {chassis.gvwr}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <AspectRatio ratio={16/9}>
            <img
              src={candidateSources[imgIdx]}
              alt={`${chassis.name}`}
              className="w-full h-full object-cover rounded"
              onError={(e) => {
                const nextIdx = imgIdx + 1
                if (nextIdx < candidateSources.length) {
                  setImgIdx(nextIdx)
                } else {
                  e.currentTarget.style.display = 'none'
                  const placeholder = e.currentTarget.nextSibling
                  if (placeholder) placeholder.style.display = 'flex'
                }
              }}
            />
            <div className="hidden w-full h-full rounded bg-gray-100 border border-dashed text-gray-600 items-center justify-center">
              <span className="text-sm">Image: {chassis.imageKey}</span>
            </div>
          </AspectRatio>
          <div>
            <div className="text-sm text-gray-700">{chassis.description}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function ConfiguratorChassisSelection() {
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

  const [selectedChassis, setSelectedChassis] = useState(() => {
    // Default to series passed in query (from home page) or existing configuration
    const params = new URLSearchParams(location.search)
    const seriesFromQuery = params.get('series')
    const initialSeries = seriesFromQuery || configuration.chassis?.series
    return initialSeries ? CHASSIS_CATALOG.find(c => c.series === initialSeries) : null
  })

  // Update URL when configuration changes
  useEffect(() => {
    const query = configToQuery(configuration)
    const newUrl = `${location.pathname}?${query}`
    window.history.replaceState(null, '', newUrl)
  }, [configuration, location.pathname])

  const handleChassisSelect = (chassis) => {
    setSelectedChassis(chassis)
    const updated = {
      ...configuration,
      chassis: {
        ...configuration.chassis,
        series: chassis.series,
        class: chassis.class
      },
      completedSteps: [1]
    }
    setConfiguration(updated)
    saveConfiguration(updated)
  }

  const handleContinue = () => {
    if (selectedChassis || isDemoMode()) {
      const query = configToQuery(configuration)
      navigate(`/configurator/body-type?${query}`)
    }
  }

  const handleBack = () => {
    navigate('/')
  }

  const isValid = isDemoMode() || !!selectedChassis

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <Stepper currentStep={1} completedSteps={configuration.completedSteps || []} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Main Content */}
          <div className="flex-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="w-6 h-6" />
                  Step 1: Select Your Chassis
                </CardTitle>
                <CardDescription>
                  Choose the base chassis platform for your commercial vehicle
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {CHASSIS_CATALOG.map((chassis) => (
                    <ChassisSelectionCard
                      key={chassis.id}
                      chassis={chassis}
                      selected={selectedChassis?.id === chassis.id}
                      onSelect={handleChassisSelect}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Completed Units Gallery */}
            <CompletedUnitsGallery
              selectedChassis={selectedChassis?.series}
              selectedBodyType={null}
              className="mt-8"
              title="Example Completed Builds"
            />
          </div>

          {/* Live Pricing Sidebar */}
          <LivePricingSidebar configuration={configuration} />
        </div>
      </div>

      <StickyActions
        onBack={handleBack}
        onContinue={handleContinue}
        disableContinue={!isValid}
        continueLabel="Continue to Body Type"
        backLabel="Back to Home"
      />
    </div>
  )
}
