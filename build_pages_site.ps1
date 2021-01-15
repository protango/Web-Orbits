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

# add .nojekyll file to bypass GH pages jekyll build
New-Item -Path .nojekyll

# delete mapping files
Remove-Item -Path "docs\*.map"
((Get-Content -path docs\bundle.js -Raw) -replace "^//# sourceMappingURL=.*?\.map$","") | Set-Content -Path docs\bundle.js -NoNewline
((Get-Content -path docs\app.css -Raw) -replace "^/\*# sourceMappingURL=.*?\.map\*/$","") | Set-Content -Path docs\app.css -NoNewline

# restore webpack config
Set-Content -Path webpack.config.js -Value $webpackconf -NoNewline
