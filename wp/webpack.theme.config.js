const { CleanWebpackPlugin } = require( 'clean-webpack-plugin' );
const CopyWebpackPlugin = require( 'copy-webpack-plugin' );
const RemoveEmptyScriptsPlugin = require( 'webpack-remove-empty-scripts' );
const RtlCssPlugin = require( 'rtlcss-webpack-plugin' );
const ImageMinimizerPlugin = require( 'image-minimizer-webpack-plugin' );
const { resolve } = require( 'node:path' );
const findFreePort = require( 'find-free-port-sync' );
const {
	Config,
	defaultConfigWP,
	modulesConfigWP,
} = require( '../helpers/webpack' );

const port =
	process.env.THEME_DEV_SERVER_PORT ||
	findFreePort( { start: 10000, end: 10999 } );

const defaultConfig = new Config( defaultConfigWP, 'default', port )
	.resetEntries()
	.addEntries(
		'src/styles/{*.{pc,sc,sa,c}ss,{blocks,variations,patterns}/**/*.{pc,sc,sa,c}ss}'
	)
	.addEntries( 'src/scripts/*.{j,t}s' )
	.changeRule( '/\\.(sc|sa)ss$/', ( rule ) => {
		const last = rule.use.length - 1;
		const root = process.cwd();

		rule.use[ last ].options.sassOptions = {
			includePaths: [ resolve( root, 'src/styles/partials' ) ],
		};
	} )
	.removePlugin( RtlCssPlugin )
	.addPlugin(
		new CleanWebpackPlugin( {
			cleanOnceBeforeBuildPatterns: [
				'**/*',
				// Each link in the path has been added, because if this is not done,
				// the scripts will be separated since it does not fall under the condition !scripts/modules/*,
				// and accordingly, the module files will be included with it...
				'!scripts',
				'!scripts/modules',
				'!scripts/modules/*',
			],
			cleanStaleWebpackAssets: false,
		} ),
		'before'
	)
	.addPlugin(
		// For styles remove JS and styles .asset.php
		new RemoveEmptyScriptsPlugin( {
			enabled: ! Config.hasDevServer( defaultConfigWP ),
		} )
	)
	.addPlugin(
		new CopyWebpackPlugin( {
			patterns: [
				{
					from: 'src/fonts',
					to: 'fonts',
					noErrorOnMissing: true,
					globOptions: {
						ignore: [ '**/readme.md' ],
					},
				},
				{
					from: 'src/social-icons',
					to: 'social-icons',
					noErrorOnMissing: true,
					globOptions: {
						ignore: [ '**/readme.md' ],
					},
				},
				{
					from: 'src/menu-icons',
					to: 'menu-icons',
					noErrorOnMissing: true,
					globOptions: {
						ignore: [ '**/readme.md' ],
					},
				},
			],
		} )
	)
	.addMinimizer(
		new ImageMinimizerPlugin( {
			minimizer: {
				implementation: ImageMinimizerPlugin.svgoMinify,
				options: {
					encodeOptions: {
						multipass: true,
						plugins: [
							{
								name: 'preset-default',
								params: {
									overrides: {
										removeViewBox: false,
									},
								},
							},
							{
								name: 'addAttributesToSVGElement',
								params: {
									attributes: [
										{
											'aria-hidden': 'true',
										},
									],
								},
							},
						],
					},
				},
			},
		} )
	)
	.addMinimizer(
		new ImageMinimizerPlugin( {
			minimizer: {
				implementation: ImageMinimizerPlugin.sharpMinify,
			},
			generator: [
				{
					type: 'asset',
					preset: 'avif',
					implementation: ImageMinimizerPlugin.sharpGenerate,
					options: {
						encodeOptions: {
							avif: {
								lossless: false,
							},
						},
					},
				},
			],
		} )
	)
	.addWatch( 'src/scripts/modules/*' );

const modulesConfig = new Config( modulesConfigWP, 'modules' )
	.resetEntries()
	.addEntries( 'src/scripts/modules/*.{j,t}s' );

const patternsConfig = new Config(
	{ entry: {}, mode: 'production' },
	'patterns'
)
	.addPlugin(
		new CopyWebpackPlugin( {
			patterns: [
				{
					from: 'src/images-for-patterns',
					to: '../patterns/images',
					noErrorOnMissing: true,
					globOptions: {
						ignore: [ '**/readme.md' ],
					},
				},
			],
		} )
	)
	.addMinimizer(
		new ImageMinimizerPlugin( {
			minimizer: {
				implementation: ImageMinimizerPlugin.svgoMinify,
				options: {
					encodeOptions: {
						multipass: true,
						plugins: [
							{
								name: 'preset-default',
							},
							{
								name: 'addAttributesToSVGElement',
								params: {
									attributes: [
										{
											'aria-hidden': 'true',
										},
									],
								},
							},
						],
					},
				},
			},
		} )
	)
	.addMinimizer(
		new ImageMinimizerPlugin( {
			minimizer: {
				implementation: ImageMinimizerPlugin.sharpMinify,
			},
			generator: [
				{
					type: 'asset',
					preset: 'avif',
					implementation: ImageMinimizerPlugin.sharpGenerate,
					options: {
						encodeOptions: {
							avif: {
								lossless: false,
							},
						},
					},
				},
			],
		} )
	);

module.exports = [
	defaultConfig.get(),
	modulesConfig.get(),
	patternsConfig.get(),
];
