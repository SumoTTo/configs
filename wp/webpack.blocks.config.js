const MiniCSSExtractPlugin = require( 'mini-css-extract-plugin' );
const RtlCssPlugin = require( 'rtlcss-webpack-plugin' );
const RemoveEmptyScriptsPlugin = require( 'webpack-remove-empty-scripts' );
const FileManagerPlugin = require( 'filemanager-webpack-plugin' );
const findFreePort = require( 'find-free-port-sync' );
const { resolve } = require( 'node:path' );
const {
	Config,
	defaultConfigWP,
	modulesConfigWP,
} = require( '../helpers/webpack' );

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
		new FileManagerPlugin( {
			events: {
				onStart: {
					delete: [
						{
							source: './build/*',
							options: {
								ignore: '**/module.*',
							},
						},
					],
				},
			},
			runOnceInWatchMode: true,
		} )
	);

if ( ! Config.hasDevServer( defaultConfigWP ) ) {
	defaultConfig.addPlugin(
		// For styles remove JS and styles .asset.php
		new RemoveEmptyScriptsPlugin()
	);
} else {
	defaultConfig.addWatch( 'src/blocks/*/scripts/module.{j,t}s' );
}

const modulesConfig = new Config( modulesConfigWP, 'modules' ).addPlugin(
	new FileManagerPlugin( {
		events: {
			onStart: {
				delete: [
					{
						source: '**/module.*',
						options: {},
					},
				],
			},
		},
		runOnceInWatchMode: true,
	} )
);

if ( process.env.WP_CONTENT_DIR ) {
	defaultConfig
		.addPlugin(
			new FileManagerPlugin( {
				events: {
					onStart: {
						delete: [
							{
								source: resolve(
									process.env.WP_CONTENT_DIR,
									'plugins/theme-blocks'
								),
								options: {
									force: true,
								},
							},
						],
					},
				},
				runOnceInWatchMode: true,
			} )
		)
		.addPlugin(
			new FileManagerPlugin( {
				events: {
					onEnd: {
						copy: [
							{
								source: '**/*',
								destination: resolve(
									process.env.WP_CONTENT_DIR,
									'plugins/theme-blocks'
								),
							},
						],
					},
				},
			} )
		);

	modulesConfig
		.addPlugin(
			new FileManagerPlugin( {
				events: {
					onStart: {
						delete: [
							{
								source: resolve(
									process.env.WP_CONTENT_DIR,
									'plugins/theme-blocks'
								),
								options: {
									force: true,
								},
							},
						],
					},
				},
				runOnceInWatchMode: true,
			} )
		)
		.addPlugin(
			new FileManagerPlugin( {
				events: {
					onEnd: {
						copy: [
							{
								source: '**/*',
								destination: resolve(
									process.env.WP_CONTENT_DIR,
									'plugins/theme-blocks'
								),
							},
						],
					},
				},
			} )
		);
}

module.exports = [ defaultConfig.get(), modulesConfig.get() ];
