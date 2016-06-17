require 'json'
package = JSON.parse(File.read('package.json'))

Pod::Spec.new do |s|

  s.name            = 'Firestack' #package['name']
  s.version         = package['version']
  s.homepage        = "https://github.com/fullstackreact/react-native-firestack"
  s.summary         = "A Firebase v3 implementation for react-native"
  s.license         = package['license']
  s.author          = package['author']
  s.platform        = :ios, "7.0"
  s.source          = { :git => package['repository']['url'], :tag => 'master' }
  s.source_files    = 'ios/*.{h,m}'
  s.preserve_paths  = "**/*.js"

  s.xcconfig            = {
    'HEADER_SEARCH_PATHS' => [
      "$(inherited)",
      "$(SRCROOT)/../../react/**",
      "${SRCROOT}/../../react-native/React/**",
      "${SRCROOT}/../../../ios/**",
    ].join(' '),
    'ALWAYS_SEARCH_USER_PATHS' => 'NO',
    'OTHER_LDFLAGS' => '$(inherited) -ObjC'
  }
  s.dependency 'React/Core'
  # s.libraries       = 'stdc++'

  [ 'Firebase/Core',
    'Firebase/Analytics',
    'Firebase/Auth',
    'Firebase/Database',
    'Firebase/Storage'
  ].each do |lib|
    s.subspec lib.split('/')[-1] do |ss|
        ss.dependency lib
        ss.xcconfig = { "FRAMEWORK_SEARCH_PATHS" => "$(PODS_ROOT)/#{lib}"}
    end
  end

end
