import path from 'node:path';
import { fileURLToPath } from 'node:url';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProd = process.env.NODE_ENV === 'production';

export default {
  mode: isProd ? 'production' : 'development',
  entry: {
    app: './src/client/webpack-entry.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist-webpack'),
    filename: 'assets/js/[name].js',
    clean: true,
    assetModuleFilename: 'assets/media/[name][ext][query]'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        include: path.resolve(__dirname, 'src/client'),
        use: {
          loader: 'babel-loader',
          options: {
            presets: [['@babel/preset-env']]
          }
        }
      },
      {
        test: /\.scss$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader', { loader: 'sass-loader', options: { sassOptions: { includePaths: ['./node_modules'] } } }]
      },
      {
        test: /\.less$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader', 'less-loader']
      },
      {
        test: /\.(png|jpe?g|gif|svg|webp|ico)$/i,
        type: 'asset/resource'
      },
      {
        test: /\.pug$/,
        use: ['pug-loader']
      }
    ]
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: 'assets/css/[name].css'
    }),
    new HtmlWebpackPlugin({
      template: './views/users.pug',
      filename: 'users.html',
      inject: 'body',
      templateParameters: {
        title: 'Users',
        cssPath: '/assets/css/app.css',
        cssPathLess: '/assets/css/app.css',
        jsPath: '/assets/js/app.js'
      }
    }),
    new HtmlWebpackPlugin({
      template: './views/friends.pug',
      filename: 'friends.html',
      inject: 'body',
      templateParameters: {
        title: 'Friends',
        cssPath: '/assets/css/app.css',
        cssPathLess: '/assets/css/app.css',
        jsPath: '/assets/js/app.js'
      }
    }),
    new HtmlWebpackPlugin({
      template: './views/news.pug',
      filename: 'news.html',
      inject: 'body',
      templateParameters: {
        title: 'News',
        cssPath: '/assets/css/app.css',
        cssPathLess: '/assets/css/app.css',
        jsPath: '/assets/js/app.js'
      }
    })
  ],
  resolve: {
    extensions: ['.js']
  },
  devtool: isProd ? false : 'source-map'
};
