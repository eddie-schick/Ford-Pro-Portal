import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
// Removed decorative icons for a cleaner, icon-free configurator experience
import { submitOrder, exportPDFQuote, emailQuote, getChassis, getBodies, getOptions } from '@/api/routes'
import { calculatePricing } from '@/lib/configurationStore'
import { useEffect, useMemo, useState } from 'react'

export function ReviewSheet({ configuration }) {
  const [submitting, setSubmitting] = useState(false)
  const [orderNumber, setOrderNumber] = useState(null)
  const [emailSent, setEmailSent] = useState(false)
  const [viewPricing, setViewPricing] = useState(null)

  // Derive pricing snapshot so the review page mirrors Step 6 even if saved state was partial
  useEffect(() => {
    const compute = async () => {
      try {
        const [chassisData, bodiesData, optionsData] = await Promise.all([
          getChassis(),
          getBodies(),
          getOptions()
        ])
        const base = calculatePricing(configuration, chassisData, bodiesData, optionsData)
        const freight = 1500
        const subtotal = (base.chassisMSRP || 0) + (base.bodyPrice || 0) + (base.optionsPrice || 0) + (base.laborPrice || 0) + freight
        const totalIncentives = configuration.pricing?.totalIncentives || 0
        const taxes = Math.round((subtotal - totalIncentives) * 0.0875)
        const total = subtotal - totalIncentives + taxes
        setViewPricing({
          chassis: base.chassisMSRP || 0,
          body: base.bodyPrice || 0,
          options: base.optionsPrice || 0,
          labor: base.laborPrice || 0,
          freight,
          subtotal,
          totalIncentives,
          taxes,
          total
        })
      } catch (e) {
        console.error('Error computing review pricing:', e)
      }
    }
    compute()
  }, [configuration])

  // Helpers to read pricing from either saved config or derived snapshot
  const pricingDisplay = useMemo(() => {
    const p = configuration.pricing || {}
    return {
      chassis: p.chassisMSRP ?? p.chassis ?? viewPricing?.chassis ?? 0,
      body: p.bodyPrice ?? p.body ?? viewPricing?.body ?? 0,
      options: p.optionsPrice ?? p.options ?? viewPricing?.options ?? 0,
      labor: p.laborPrice ?? p.labor ?? viewPricing?.labor ?? 0,
      subtotal: p.subtotal ?? viewPricing?.subtotal ?? 0,
      totalIncentives: p.totalIncentives ?? viewPricing?.totalIncentives ?? 0,
      taxes: p.taxes ?? viewPricing?.taxes ?? 0,
      total: p.total ?? viewPricing?.total ?? 0
    }
  }, [configuration.pricing, viewPricing])

  const handleExportPDF = async () => {
    try {
      await exportPDFQuote(configuration)
    } catch (error) {
      console.error('Error exporting PDF:', error)
    }
  }

  const handleEmailQuote = async (recipient) => {
    try {
      await emailQuote(configuration, recipient)
      setEmailSent(true)
    } catch (error) {
      console.error('Error emailing quote:', error)
    }
  }

  const handleSubmitOrder = async () => {
    setSubmitting(true)
    try {
      const order = await submitOrder({
        chassis: configuration.chassis,
        bodyType: configuration.bodyType,
        bodyManufacturer: configuration.bodyManufacturer,
        bodySpecs: configuration.bodySpecs,
        bodyAccessories: configuration.bodyAccessories,
        upfitter: configuration.upfitter,
        pricing: configuration.pricing,
        financing: configuration.financing,
        totalPrice: configuration.pricing.total
      })
      setOrderNumber(order.orderNumber)
    } catch (error) {
      console.error('Error submitting order:', error)
    }
    setSubmitting(false)
  }

  const handleShare = () => {
    // Generate shareable URL with configuration
    const params = new URLSearchParams()
    params.set('bt', configuration.bodyType)
    params.set('bm', configuration.bodyManufacturer)
    params.set('series', configuration.chassis.series)
    params.set('cab', configuration.chassis.cab)
    params.set('dr', configuration.chassis.drivetrain)
    params.set('wb', configuration.chassis.wheelbase)
    params.set('pt', configuration.chassis.powertrain)
    
    const url = `${window.location.origin}/configure?${params.toString()}`
    
    if (navigator.share) {
      navigator.share({
        title: 'Ford Commercial Vehicle Configuration',
        text: 'Check out my custom Ford commercial vehicle build',
        url: url
      })
    } else {
      // Fallback to copying to clipboard
      navigator.clipboard.writeText(url)
      alert('Configuration link copied to clipboard!')
    }
  }

  if (orderNumber) {
    return (
      <div className="space-y-6">
        <Alert className="bg-green-50 border-green-200">
          <Check className="h-4 w-4 text-green-600" />
          <AlertDescription>
            <div className="font-medium text-green-900 text-lg mb-2">
              Order Submitted Successfully!
            </div>
            <div className="space-y-1">
              <p>Order Number: <strong>{orderNumber}</strong></p>
              <p>A dealer representative will contact you within 24-48 hours to finalize your order.</p>
            </div>
          </AlertDescription>
        </Alert>
        
        <Card>
          <CardHeader>
            <CardTitle>Next Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3 text-sm">
              <li className="flex items-start">
                <span className="font-semibold mr-2">1.</span>
                <span>Dealer review and confirmation of specifications</span>
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2">2.</span>
                <span>Final pricing and financing approval</span>
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2">3.</span>
                <span>Production scheduling and order tracking</span>
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2">4.</span>
                <span>Upfit coordination and installation</span>
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2">5.</span>
                <span>Delivery and final inspection</span>
              </li>
            </ol>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Build Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Build Summary</CardTitle>
          <CardDescription>
            Review your configuration before submitting
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Chassis Specs - comprehensive */}
          <div>
            <h3 className="font-semibold mb-3">Chassis Specifications</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between"><span className="text-gray-600">Series</span><span className="font-medium">{configuration.chassis.series || '—'}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Cab</span><span className="font-medium">{configuration.chassis.cab || '—'}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Drivetrain</span><span className="font-medium">{configuration.chassis.drivetrain || '—'}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Wheelbase</span><span className="font-medium">{configuration.chassis.wheelbase ? `${configuration.chassis.wheelbase}"` : '—'}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Suspension</span><span className="font-medium">{configuration.chassis.suspensionPackage || '—'}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Powertrain</span><span className="font-medium">{configuration.chassis.powertrain || '—'}</span></div>
              {/* Dummy extended specs that vary by series */}
              <div className="flex justify-between"><span className="text-gray-600">GVWR</span><span className="font-medium">{({ 'F-350':'12,000–14,000 lbs','F-450':'14,000–16,500 lbs','F-550':'17,500–19,500 lbs','F-600':'22,000 lbs','F-650':'25,600–29,000 lbs','F-750':'Up to 37,000 lbs','E-350':'10,050–12,700 lbs','E-450':'Up to 14,500 lbs' }[configuration.chassis.series] || '—')}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Fuel Type</span><span className="font-medium">{configuration.chassis.powertrain?.toLowerCase?.().includes('diesel') ? 'Diesel' : 'Gasoline'}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Axle Ratio</span><span className="font-medium">{configuration.chassis.drivetrain?.includes('4x4') ? '4.30' : '3.73'}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Towing (est.)</span><span className="font-medium">{configuration.chassis.series?.startsWith('F-6') ? '25,000+ lbs' : configuration.chassis.series?.startsWith('F-5') ? '20,000+ lbs' : '15,000+ lbs'}</span></div>
            </div>
          </div>

          {/* Body Specs - comprehensive */}
          <div>
            <h3 className="font-semibold mb-3">Body Specifications</h3>
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <div className="flex justify-between"><span className="text-gray-600">Body Type</span><span className="font-medium">{configuration.bodyType || '—'}</span></div>
              {configuration.bodyType !== 'Chassis Only' && (
                <>
                  <div className="flex justify-between"><span className="text-gray-600">Manufacturer</span><span className="font-medium">{configuration.bodyManufacturer || '—'}</span></div>
                  {Object.entries(configuration.bodySpecs || {}).length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {Object.entries(configuration.bodySpecs).map(([key, value]) => (
                        <div key={key} className="flex justify-between text-sm">
                          <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g,' $1').trim()}</span>
                          <span className="font-medium">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-600">No body specifications selected.</div>
                  )}
                </>
              )}
            </div>
          </div>
          {/* Chassis Configuration */}
          <div>
            <h3 className="font-semibold mb-3">Chassis Configuration</h3>
            <div className="grid grid-cols-2 gap-3 text-sm bg-gray-50 p-4 rounded-lg">
              <div>
                <span className="text-gray-600">Series:</span>
                <span className="ml-2 font-medium">{configuration.chassis.series}</span>
              </div>
              <div>
                <span className="text-gray-600">Cab:</span>
                <span className="ml-2 font-medium">{configuration.chassis.cab}</span>
              </div>
              <div>
                <span className="text-gray-600">Drivetrain:</span>
                <span className="ml-2 font-medium">{configuration.chassis.drivetrain}</span>
              </div>
              <div>
                <span className="text-gray-600">Wheelbase:</span>
                <span className="ml-2 font-medium">{configuration.chassis.wheelbase}"</span>
              </div>
              <div>
                <span className="text-gray-600">Suspension:</span>
                <span className="ml-2 font-medium">{configuration.chassis.suspensionPackage}</span>
              </div>
              <div>
                <span className="text-gray-600">Powertrain:</span>
                <span className="ml-2 font-medium">{configuration.chassis.powertrain}</span>
              </div>
            </div>
          </div>

          {/* Body Configuration */}
          <div>
            <h3 className="font-semibold mb-3">Body Configuration</h3>
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Body Type:</span>
                <span className="font-medium">{configuration.bodyType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Manufacturer:</span>
                <span className="font-medium">{configuration.bodyManufacturer}</span>
              </div>
              {Object.entries(configuration.bodySpecs || {}).length > 0 && (
                <div className="border-t pt-3">
                  <div className="text-sm font-medium mb-2">Specifications:</div>
                  <div className="space-y-1">
                    {Object.entries(configuration.bodySpecs).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-sm">
                        <span className="text-gray-600 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}:
                        </span>
                        <span>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {configuration.bodyAccessories?.length > 0 && (
                <div className="border-t pt-3">
                  <div className="text-sm font-medium mb-2">Accessories:</div>
                  <div className="flex flex-wrap gap-2">
                    {configuration.bodyAccessories.map((acc) => (
                      <Badge key={acc} variant="secondary" className="text-xs">
                        {acc.replace(/([A-Z])/g, ' $1').trim()}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Upfitter */}
          <div>
            <h3 className="font-semibold mb-3">Upfitter/Installer</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              {configuration.upfitter ? (
                <>
                  <div className="font-medium">{configuration.upfitter.name}</div>
                  <div className="text-sm text-gray-600 mt-1">{configuration.upfitter.address}</div>
                  <div className="text-sm text-gray-600">{configuration.upfitter.phone}</div>
                  <div className="flex gap-2 mt-2">
                    {configuration.upfitter.certifications?.map((cert) => (
                      <Badge key={cert} variant="outline" className="text-xs">
                        {cert}
                      </Badge>
                    ))}
                  </div>
                  <div className="text-sm mt-2">
                    <span className="text-gray-600">Lead Time:</span>
                    <span className="ml-2 font-medium">{configuration.upfitter.leadTime}</span>
                  </div>
                </>
              ) : (
                <p className="text-gray-500">No upfitter selected</p>
              )}
            </div>
          </div>

          {/* Pricing */}
          <div>
            <h3 className="font-semibold mb-3">Pricing Summary</h3>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Chassis MSRP:</span>
                <span className="font-medium">${Math.round(pricingDisplay.chassis).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Body & Equipment:</span>
                <span className="font-medium">${Math.round(pricingDisplay.body).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              </div>
              {pricingDisplay.options > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Options:</span>
                  <span className="font-medium">${Math.round(pricingDisplay.options).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Labor & Installation:</span>
                <span className="font-medium">${Math.round(pricingDisplay.labor).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Freight & Delivery:</span>
                <span className="font-medium">${Math.round(configuration.pricing?.freight || 1500).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              </div>
              {pricingDisplay.totalIncentives > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Incentives:</span>
                  <span className="font-medium">-${Math.round(pricingDisplay.totalIncentives).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between font-bold text-lg">
                <span>Estimated Total:</span>
                <span className="text-blue-600">${Math.round(pricingDisplay.total).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              </div>
            </div>
          </div>

          {/* Financing */}
          {configuration.financing && (
            <div>
              <h3 className="font-semibold mb-3">Financing Details</h3>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">APR:</span>
                  <span className="font-medium">{configuration.financing.apr}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Term:</span>
                  <span className="font-medium">{configuration.financing.term} months</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Down Payment:</span>
                  <span className="font-medium">
                    ${Math.round((configuration.financing.downPaymentAmount ?? (pricingDisplay.total * ((configuration.financing.downPayment ?? 0) > 1 ? configuration.financing.downPayment / 100 : (configuration.financing.downPayment ?? 0)) ))).toLocaleString()} 
                    ({((configuration.financing.downPayment ?? 0) > 1 ? configuration.financing.downPayment : (configuration.financing.downPayment ?? 0) * 100)}%)
                  </span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold">
                  <span>Est. Monthly Payment:</span>
                  <span>${Math.round(configuration.financing.monthlyPayment || 0).toLocaleString()}/mo</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button variant="outline" onClick={handleShare}>Share</Button>
            <Button variant="outline" onClick={handleExportPDF}>Export PDF</Button>
            <Button 
              variant="outline" 
              onClick={() => handleEmailQuote('dealer@example.com')}
              disabled={emailSent}
            >
              {emailSent ? 'Sent!' : 'Email'}
            </Button>
            <Button variant="outline" onClick={() => window.print()}>Print</Button>
          </div>
          
          <div className="mt-6 pt-6 border-t">
            <Button 
              onClick={handleSubmitOrder}
              disabled={submitting}
              className="w-full"
              size="lg"
            >
              {submitting ? 'Submitting...' : 'Submit Order Request'}
            </Button>
            <p className="text-xs text-gray-500 text-center mt-2">
              By submitting, you'll receive a quote from the dealer within 24-48 hours
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
