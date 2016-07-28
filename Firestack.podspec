require 'json'
package = JSON.parse(File.read('package.json'))
version = package["version"]
repo = package['repository']
author = package['author']

Pod::Spec.new do |s|

  s.name         = "Firestack"
  s.version      = version
  s.summary      = "Firestack makes working with Firebase v3 easy"

  # This description is used to generate tags and improve search results.
  #   * Think: What does it do? Why did you write it? What is the focus?
  #   * Try to keep it short, snappy and to the point.
  #   * Write the description between the DESC delimiters below.
  #   * Finally, don't worry about the indent, CocoaPods strips it!
  s.description  = <<-DESC
  Wanna integrate firebase into your app using React Native?
                   DESC

  s.homepage     = "http://fullstackreact.com"
  # s.screenshots  = "www.example.com/screenshots_1.gif", "www.example.com/screenshots_2.gif"


  # ―――  Spec License  ――――――――――――――――――――――――――――――――――――――――――――――――――――――――――― #
  #
  #  Licensing your code is important. See http://choosealicense.com for more info.
  #  CocoaPods will detect a license file if there is a named LICENSE*
  #  Popular ones are 'MIT', 'BSD' and 'Apache License, Version 2.0'.
  #

  s.license      = { :type => "MIT", :file => "LICENSE" }


  # ――― Author Metadata  ――――――――――――――――――――――――――――――――――――――――――――――――――――――――― #
  #
  #  Specify the authors of the library, with email addresses. Email addresses
  #  of the authors are extracted from the SCM log. E.g. $ git log. CocoaPods also
  #  accepts just a name if you'd rather not provide an email address.
  #
  #  Specify a social_media_url where others can refer to, for example a twitter
  #  profile URL.
  #

  s.author             = { "Ari Lerner" => author }
  # Or just: s.author    = "Ari Lerner"
  # s.authors            = { "Ari Lerner" => "arilerner@mac.com" }
  # s.social_media_url   = "http://twitter.com/Ari Lerner"

  # ――― Platform Specifics ――――――――――――――――――――――――――――――――――――――――――――――――――――――― #
  #
  #  If this Pod runs only on iOS or OS X, then specify the platform and
  #  the deployment target. You can optionally include the target after the platform.

  #  When using multiple platforms
  s.ios.deployment_target = "8.0"
  # s.osx.deployment_target = "10.7"
  # s.watchos.deployment_target = "2.0"
  # s.tvos.deployment_target = "9.0"


  # ――― Source Location ―――――――――――――――――――――――――――――――――――――――――――――――――――――――――― #
  #
  #  Specify the location from where the source should be retrieved.
  #  Supports git, hg, bzr, svn and HTTP.
  #

  # s.source       = { :git => "https://github.com/fullstackreact/react-native-firestack.git", :tag => "#{s.version}" }
  s.source = { :git => repo['url'], :tag => "feature/remoteConfig" }
  # s.source_files  = "ios/Firestack"#, "ios/Firestack/*.{h,m}"

  s.source_files   = 'ios/Firestack/**/*.{h,m}'
  s.preserve_paths = 'README.md', 'package.json', '**/*.js'
  # s.preserve_paths = "**/*.js", "ios/Firestack/Pods/**/*.h"
  # s.preserve_paths = ["**/*.js", "ios/Firestack/Pods/**/*"]

  [
    'Firebase/Core',
    'Firebase/Auth',
    'Firebase/Storage',
    'Firebase/Database',
    'Firebase/RemoteConfig'
  ].each do |lib|
    s.dependency lib
  end
  s.dependency 'React'

  s.pod_target_xcconfig = {
    'OTHER_LDFLAGS' => '$(inherited) -ObjC -lBOZO'
  }

  # s.ios.vendored_library    = 'libFirestack.a'
  s.ios.framework           = 'SystemConfiguration', 'CFNetwork', 'Security'
  s.ios.libraries           = 'c++'

  # s.requires_arc = true

  # s.xcconfig = { "HEADER_SEARCH_PATHS" => "$(SDKROOT)/usr/include/libxml2" }
  # s.dependency "JSONKit", "~> 1.4"
end
