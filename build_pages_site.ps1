# backup webpack config
$webpackconf = Get-Content -path webpack.config.js -Raw

# delete docs folder
Remove-Item -Path "docs" -Recurse -ErrorAction Ignore

# change webpack to production
($webpackconf -replace "mode:\s*['""]\w*['""]","mode: 'production'") | Set-Content -Path webpack.config.js -NoNewline

# build project
npm run build

# copy build files to docs directory
Copy-Item -Path "dist\public" -Destination "docs" -Recurse

# delete mapping files
Remove-Item -Path "docs\*.map"

# restore webpack config
Set-Content -Path webpack.config.js -Value $webpackconf -NoNewline