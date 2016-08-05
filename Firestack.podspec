require 'json'
package = JSON.parse(File.read('package.json'))
version = package["version"]
repo = package['repository']
author = package['author']

all_pods = [      
  'FirebaseAnalytics', 'FirebaseAuth', 'FirebaseRemoteConfig',
  'FirebaseDatabase', 'FirebaseStorage', 'FirebaseInstanceID',
  'GoogleInterchangeUtilities', 'GoogleIPhoneUtilities',
  'GoogleNetworkingUtilities', 'GoogleParsingUtilities',
  'GoogleSymbolUtilities'
]

Pod::Spec.new do |s|

  s.name         = "Firestack"
  s.version      = version
  s.summary      = "Firestack makes working with Firebase v3 easy"

  s.description  = <<-DESC
  Wanna integrate firebase into your app using React Native?
                   DESC

  s.homepage     = "http://fullstackreact.com"

  s.license      = { :type => "MIT", :file => "LICENSE" }
  s.author             = { "Ari Lerner" => author }
  s.social_media_url   = 'http://twitter.com/fullstackio'

  #  When using multiple platforms
  s.ios.deployment_target = "8.0"
  # s.osx.deployment_target = "10.7"
  # s.watchos.deployment_target = "2.0"
  # s.tvos.deployment_target = "9.0"

  s.source = { :git => repo['url'], :tag => "v#{version}" }
  s.public_header_files = "ios/Firestack/*.h"

  s.source_files   = 'ios/Firestack/*.{h,m}'
  s.preserve_paths = 'README.md', 'package.json', '*.js'

  s.ios.frameworks = [
    'CFNetwork', 'Security', 'SystemConfiguration'
  ]
  s.ios.libraries = ['icucore', 'c++', 'sqlite3', 'z']

  s.xcconfig = {
    'HEADER_SEARCH_PATHS' => [
        "$(inherited)", 
        "${SRCROOT}/../../React/**", 
        "${SRCROOT}/../../node_modules/react-native/**"
      ].join(' '),
    'FRAMEWORK_SEARCH_PATHS' => [
        "$(inherited)", 
        "${PODS_ROOT}/Firebase/**",
        "${PODS_ROOT}/FirebaseStorage/**",
      ].join(' '),
    'OTHER_LDFLAGS' => '$(inherited) -ObjC'
  }
end