const { resolve } = require( 'node:path' );

module.exports = ( api ) => {
	const isProduction = api.mode === 'production';

	return {
		ident: 'postcss',
		sourceMap: ! isProduction,
		plugins: [
			[ 'autoprefixer', { grid: true } ],
			[ require( resolve( __dirname, '../postcss/wrap-selector.js' ) ) ],
			isProduction && [
				'cssnano',
				{
					preset: [
						'default',
						{
							discardComments: {
								removeAll: true,
							},
						},
					],
				},
			],
		],
	};
};
