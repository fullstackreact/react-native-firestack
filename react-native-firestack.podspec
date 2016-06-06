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
  s.source          = { :git => "https://github.com/fullstackreact/react-native-firestack.git", :tag => "#{s.version}" }
  s.source_files    = 'ios/*.{h,m}'
  s.preserve_paths  = "**/*.js"

  s.dependency 'React/Core', :path => 'node_modules/react-native'

  s.dependency 'Firebase'
  s.dependency 'Firebase/Core'
  s.dependency 'Firebase/Analytics'
  s.dependency 'Firebase/Auth'
  s.dependency 'Firebase/Database'
  s.dependency 'Firebase/Storage'

end
