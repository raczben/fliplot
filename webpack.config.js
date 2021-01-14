const path = require('path');

module.exports = {
    entry: './js/interact.js',
    module: {
        rules: [
            {
                test: /\.m?js$/,
                exclude: /(node_modules|bower_components)/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env',
                            {
                                'plugins': ['@babel/plugin-proposal-class-properties']
                            }
                        ]
                    }
                }
            }
        ]
    }
};
