const CopyWebpackPlugin = require( 'copy-webpack-plugin' );
const RemoveEmptyScriptsPlugin = require( 'webpack-remove-empty-scripts' );
const RtlCssPlugin = require( 'rtlcss-webpack-plugin' );
const ImageMinimizerPlugin = require( 'image-minimizer-webpack-plugin' );
const SyncDirectoryWebpackPlugin = require( '../helpers/sync-directory-webpack-plugin' );
const FileManagerPlugin = require( 'filemanager-webpack-plugin' );
const findFreePort = require( 'find-free-port-sync' );
const { resolve } = require( 'node:path' );
const {
	Config,
	defaultConfigWP,
	modulesConfigWP,
} = require( '../helpers/webpack' );
const root = process.cwd().replace( /\\/g, '/' );

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

		rule.use[ last ].options.sassOptions = {
			includePaths: [ resolve( root, 'src/styles/partials' ) ],
		};
	} )
	.removePlugin( RtlCssPlugin )
	.addPlugin(
		new FileManagerPlugin( {
			events: {
				onStart: {
					delete: [
						{
							source: './build/*',
							options: {
								ignore: './build/scripts/modules/**/*',
							},
						},
					],
				},
			},
			runOnceInWatchMode: true,
		} )
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
				},
				{
					from: 'src/images',
					to: 'images',
					noErrorOnMissing: true,
				},
				{
					from: 'src/social-icons',
					to: 'social-icons',
					noErrorOnMissing: true,
				},
				{
					from: 'src/menu-icons',
					to: 'menu-icons',
					noErrorOnMissing: true,
				},
			],
		} )
	)
	.addMinimizer(
		new ImageMinimizerPlugin( {
			minimizer: [
				{
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
			],
		} )
	);

const modulesConfig = new Config( modulesConfigWP, 'modules' )
	.resetEntries()
	.addEntries( 'src/scripts/modules/*.{j,t}s' )
	.addPlugin(
		new FileManagerPlugin( {
			events: {
				onStart: {
					delete: [
						{
							source: './build/scripts/modules/*',
							options: {},
						},
					],
				},
			},
			runOnceInWatchMode: true,
		} )
	);

if ( process.env.WP_CONTENT_DIR ) {
	const syncDirectory = new SyncDirectoryWebpackPlugin( {
		sourceDir: root,
		targetDir: resolve( process.env.WP_CONTENT_DIR, 'themes/theme-child' ),
	} );

	defaultConfig.addPlugin( syncDirectory );
	modulesConfig.addPlugin( syncDirectory );
}

module.exports = [ defaultConfig.get(), modulesConfig.get() ];
