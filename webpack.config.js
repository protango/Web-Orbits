const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
    mode: 'development',
    entry: {
        app: './src/index.ts'
    },
    output: {
        path: path.resolve(__dirname, 'dist/public'),
        filename: 'bundle.js'
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js'],
        alias: {
            assets: path.resolve(__dirname, 'assets'),
            src: path.resolve(__dirname, 'src')
        }
    },
    devtool: 'source-map',
    plugins: [
        new HtmlWebpackPlugin({
            title: 'Web-Orbits'
        }),
        new MiniCssExtractPlugin()
    ],
    module: {
        rules: [{
            test: /\.tsx?$/,
            loader: 'ts-loader',
            exclude: /node_modules/
        }, {
            test: /\.s[ac]ss$/i,
            use: [
              MiniCssExtractPlugin.loader,
              // Translates CSS into CommonJS
              'css-loader',
              // Compiles Sass to CSS
              'sass-loader',
            ],
        }, {
            test: /\.html$/,
            exclude: /node_modules/,
            use: {loader: 'html-loader'}
        },
        {
            test: /\.(png|svg|jpg|gif)$/,
            use: {
                loader: 'file-loader', 
                options: {
                    name: "[path][name].[ext]"
                }
            }
        }]
    }
}