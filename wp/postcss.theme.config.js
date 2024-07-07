module.exports = ( api ) => {
	const isProduction = api.mode === 'production';

	return {
		ident: 'postcss',
		sourceMap: ! isProduction,
		plugins: [
			[ 'autoprefixer', { grid: true } ],
			[
				'postcss-increase-specificity',
				{
					repeat: 1,
					overrideIds: false,
					stackableRoot: ':is(.is-root-container,.wp-site-blocks)',
				},
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
