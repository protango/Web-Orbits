# backup webpack config
$webpackconf = Get-Content -path webpack.config.js -Raw

# change webpack to production
($webpackconf -replace "mode:\s*['""]\w*['""]","mode: 'production'") | Set-Content -Path webpack.config.js -NoNewline

# build project
npm run build

# copy build files to docs directory
Copy-Item -Path "dist\public" -Destination "docs" -Recurse

# restore webpack config
Set-Content -Path webpack.config.js -Value $webpackconf -NoNewline