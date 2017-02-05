require 'json'

package = JSON.parse(File.read('package.json'))

Pod::Spec.new do |s|
  s.name                = "Firestack"
  s.version             = package["version"]
  s.summary             = package["description"]
  s.description         = <<-DESC
                            Wanna integrate firebase into your app using React Native?
                          DESC
  s.homepage            = "http://fullstackreact.com"
  s.license             = package['license']
  s.author              = "Ari Lerner"
  s.source              = { :git => "https://github.com/fullstackreact/react-native-firestack.git", :tag => "v#{s.version}" }
  s.social_media_url    = 'http://twitter.com/fullstackio'
  s.platform            = :ios, "8.0"
  s.header_dir          = 'ios/Firestack'
  s.preserve_paths      = 'README.md', 'package.json', '*.js'
  s.source_files        = 'ios/Firestack/*.{h,m}'
  s.dependency          'React'
  s.dependency          'Firebase/Auth'
  s.dependency          'Firebase/Core'
  s.dependency          'Firebase/Database'
  s.dependency          'Firebase/Messaging'
  s.dependency          'Firebase/RemoteConfig'
  s.dependency          'Firebase/Storage'
end
