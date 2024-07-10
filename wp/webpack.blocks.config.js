const MiniCSSExtractPlugin = require( 'mini-css-extract-plugin' );
const RtlCssPlugin = require( 'rtlcss-webpack-plugin' );
const RemoveEmptyScriptsPlugin = require( 'webpack-remove-empty-scripts' );
const SyncDirectoryWebpackPlugin = require( '../helpers/sync-directory-webpack-plugin' );
const CleanWebpackPlugin = require( '../helpers/clean-webpack-plugin' );
const findFreePort = require( 'find-free-port-sync' );
const { resolve } = require( 'node:path' );
const {
	Config,
	defaultConfigWP,
	modulesConfigWP,
} = require( '../helpers/webpack' );
const root = process.cwd().replace( /\\/g, '/' );

const port =
	process.env.THEME_BLOCK_DEV_SERVER_PORT ||
	findFreePort( { start: 11000, end: 11999 } );

const defaultConfig = new Config( defaultConfigWP, 'default', port )
	.addEntries( 'src/blocks/**/styles/*.{pc,sc,sa,c}ss' )
	.addEntries( 'src/index.{ts,tsx}' )
	.removePlugin( RtlCssPlugin )
	.replacePlugin(
		new MiniCSSExtractPlugin( {
			filename( pathData ) {
				return `${ pathData.chunk.name.replace(
					'/scripts/',
					'/styles/'
				) }.css`;
			},
		} )
	)
	.addPlugin(
		new CleanWebpackPlugin( {
			patterns: [
				resolve(
					process.env.WP_CONTENT_DIR,
					'plugins/theme-blocks/build/**/*'
				),
				'!' +
					resolve(
						process.env.WP_CONTENT_DIR,
						'plugins/theme-blocks/build/**/module.*'
					),
			],
		} )
	);

if ( ! Config.hasDevServer( defaultConfigWP ) ) {
	defaultConfig.addPlugin(
		// For styles remove JS and styles .asset.php
		new RemoveEmptyScriptsPlugin()
	);
}

const modulesConfig = new Config( modulesConfigWP, 'modules' ).addPlugin(
	new CleanWebpackPlugin( {
		patterns: [
			resolve(
				process.env.WP_CONTENT_DIR,
				'plugins/theme-blocks/build/**/module.*'
			),
		],
	} )
);

if ( process.env.WP_CONTENT_DIR ) {
	const buildPath = resolve(
		process.env.WP_CONTENT_DIR,
		'plugins/theme-blocks/build'
	);
	defaultConfigWP.output.path = buildPath;
	modulesConfigWP.output.path = buildPath;

	const syncDirectory = new SyncDirectoryWebpackPlugin( {
		sourceDir: root,
		targetDir: resolve(
			process.env.WP_CONTENT_DIR,
			'plugins/theme-blocks'
		),
		exclude: [ /build/ ],
	} );

	defaultConfig.addPlugin( syncDirectory );
	modulesConfig.addPlugin( syncDirectory );
}

module.exports = [ defaultConfig.get(), modulesConfig.get() ];
