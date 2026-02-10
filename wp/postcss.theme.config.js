const { resolve } = require( 'node:path' );

const shouldApplyWrapSelector = ( filePath ) => {
	if ( ! filePath ) {
		return true;
	}

	return ! /node_modules/.test( filePath );
};

module.exports = ( api ) => {
	const isProduction = api.mode === 'production';
	const currentFile = api.file;
	const applyWrapSelector = shouldApplyWrapSelector( currentFile );

	return {
		ident: 'postcss',
		sourceMap: ! isProduction,
		plugins: [
			[ 'autoprefixer', { grid: true } ],
			applyWrapSelector && [
				require( resolve( __dirname, '../postcss/wrap-selector.js' ) ),
			],
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
