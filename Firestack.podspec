require 'json'
package = JSON.parse(File.read('package.json'))
version = package["version"]
repo = package['repository']
author = package['author']

default_header_search_paths = ["$(inherited)", "${SRCROOT}/../../React/**", "${SRCROOT}/../node_modules/react-native/**"]

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
  s.public_header_files = "ios/Firestack/*.h", "Pods/**/*.h"

  s.source_files   = 'ios/Firestack/*.{h,m}'
  s.preserve_paths = 'README.md', 'package.json', '*.js'

  s.default_subspec = 'Core'

  s.subspec 'Core' do |ss|
    [
      'Firebase/Core',
      'Firebase/Auth',
      'Firebase/Storage',
      'Firebase/Database',
      'Firebase/RemoteConfig'
    ].each do |lib|
      ss.dependency lib
    end

  
    ss.xcconfig = {
      'HEADER_SEARCH_PATHS' => default_header_search_paths.join(' ')
    }

    ss.user_target_xcconfig = {
      'HEADER_SEARCH_PATHS' => default_header_search_paths.join(' '),
      'FRAMEWORK_SEARCH_PATHS' => default_header_search_paths.join(' ')
    }
  end

  s.subspec 'Test' do |ss|
    ss.dependency 'Firestack/Core'
    # ss.dependency 'React'

    ss.xcconfig = {
      'HEADER_SEARCH_PATHS' => [
        default_header_search_paths,
        "$(SRCROOT)/../../react-native/React/**",
      ].flatten.join(' ')
    }
  end

  # s.vendored_frameworks = ['Firebase']

  # s.ios.framework           = [
  #   'SystemConfiguration', 'CFNetwork', 'Security', 'UIKit',
  #   'CoreFoundation', 'StoreKit', 'MobileCoreServices',
  # ]

  s.requires_arc = true
end
