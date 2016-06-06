require 'json'
package = JSON.parse(File.read('package.json'))

Pod::Spec.new do |s|

  s.name            = package['name']
  s.version         = package['version']
  s.homepage        = "https://github.com/fullstackreact/react-native-firestack"
  s.summary         = "A Firebase v3 implementation for react-native"
  s.license         = package['license']
  s.author          = package['author']
  s.platform        = :ios, "7.0"
  s.source          = { :git => package['repository']['url'], :tag => "#{s.version}" }
  s.source_files    = 'ios/*.{h,m}'
  s.preserve_paths  = "**/*.js"
  s.exclude_files   = "Sample"

  [ 'Firebase',
    'Firebase/Core',
    'Firebase/Analytics',
    'Firebase/Auth',
    'Firebase/Database',
    'Firebase/Storage'
  ].each do |lib|
    s.subspec lib.split('/')[-1] do |ss|
      ss.dependency lib
      ss.xcconfig = {
        'FRAMEWORK_SEARCH_PATHS' => '"$(PODS_ROOT)/${lib}"',
        # "FRAMEWORK_SEARCH_PATHS" => "$(PODS_ROOT)/#{lib}",
      }
    end
  end
  # s.dependency 'React/Core'
  # s.dependency 'Firebase'
  # s.dependency 'Firebase/Core'
  # s.dependency 'Firebase/Analytics'
  # s.dependency 'Firebase/Auth'
  # s.dependency 'Firebase/Database'
  # s.dependency 'Firebase/Storage'

end
