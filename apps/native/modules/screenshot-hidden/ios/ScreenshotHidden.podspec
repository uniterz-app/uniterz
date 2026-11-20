Pod::Spec.new do |s|
  s.name           = 'ScreenshotHidden'
  s.version        = '1.0.0'
  s.summary        = 'Hide React Native children from screenshots and screen recordings'
  s.description    = 'Hosts children inside the secure canvas of a UITextField so the system leaves them out of captures.'
  s.author         = 'UNITERZ'
  s.homepage       = 'https://www.uniterz.app'
  s.platforms      = { :ios => '15.1' }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = "**/*.{h,m,mm,swift}"
end
