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
  s.source          = { :git => package['repository']['url'], :tag => "#{s.version}" }
  s.source_files    = 'ios/*.{h,m}'
  s.preserve_paths  = "**/*.js"

  s.xcconfig            = {
    # 'FRAMEWORK_SEARCH_PATHS' => '$(SRCROOT)/React $(SRCROOT)/Firebase/** $(SRCROOT)/**',
    'OTHER_LDFLAGS' => '$(inherited)'
  }
  s.dependency 'React/Core'
  # s.libraries       = 'stdc++'

  [ 'Firebase/Core',
    'Firebase',
    'Firebase/Analytics',
    'Firebase/Auth',
    'Firebase/Database',
    'Firebase/Storage'
  ].each do |lib|
      s.dependency lib
  end

end
