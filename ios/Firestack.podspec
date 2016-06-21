require 'json'
pkgFile = File.expand_path('../package.json', File.dirname(__FILE__))
package = JSON.parse(File.read(pkgFile))

Pod::Spec.new do |s|

  s.name            = 'Firestack' #package['name']
  s.version         = package['version']
  s.homepage        = "https://github.com/fullstackreact/react-native-firestack"
  s.summary         = "A Firebase v3 implementation for react-native"
  # s.license         = { :type => package['license'], :file => 'LICENSE' },
  s.license          = { :type => 'MIT', :file => '../LICENSE' }
  s.author          = package['author']
  s.platform        = :ios, "8.0"
  s.source          = { :git => package['repository']['url'], :tag => 'master' }
  # s.source           = { :git => 'https://github.com/fullstackreact/react-native-firestack.git', :tag => s.version.to_s }
  # s.public_header_files = 'Firestack/**/*.h'

  s.public_header_files = 'Firestack/**/*.h'
  s.source_files    = 'Firestack', 'Firestack/**/*.{h,m}'

  s.description      = <<-DESC
Make it easy to work with the new Firebase and React-Native.
Currently, this is best installed through npm:

    npm install --save react-native-firestack
                       DESC

  # s.screenshots     = 'www.example.com/screenshots_1', 'www.example.com/screenshots_2'

  s.social_media_url = 'https://twitter.com/fullstackreact'
  s.ios.deployment_target = '8.0'

#   s.pod_target_xcconfig = {
#   # 'ENABLE_BITCODE'         => 'NO',
#   # 'CLANG_MODULES_AUTOLINK'
#   'HEADER_SEARCH_PATHS' => [
#     '$(inherited)',
#     '$(SRCROOT)/../react/**',
#     '$(SRCROOT)/../react-native/React/**',
#     '$(PODS_ROOT)/**'
#   ].join(' '),
#   'OTHER_LDFLAGS'          => '$(inherited) -ObjC' # -undefined dynamic_lookup
# }
#
  s.frameworks = 'UIKit'

  [ 'Firebase/Core',
    'Firebase/Analytics',
    'Firebase/Auth',
    'Firebase/Database',
    'Firebase/Storage'
  ].each do |lib|
    s.dependency lib
  end

  s.subspec 'Lib' do |ss|
    ## Don't install Firebase, i.e.:
    # s.dependency 'React' ## For pod lib lint purposes
  end
end
