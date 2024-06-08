const MiniCSSExtractPlugin = require( 'mini-css-extract-plugin' );
const RtlCssPlugin = require( 'rtlcss-webpack-plugin' );
const { CleanWebpackPlugin } = require( 'clean-webpack-plugin' );
const RemoveEmptyScriptsPlugin = require( 'webpack-remove-empty-scripts' );
const findFreePort = require( 'find-free-port-sync' );
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
		new CleanWebpackPlugin( {
			cleanOnceBeforeBuildPatterns: [
				'**/*',
				// Each link in the path has been added, because if this is not done,
				// the scripts will be separated since it does not fall under the condition !blocks/**/scripts/module*,
				// and accordingly, the module files will be included with it...
				'!blocks/**/',
				'!blocks/**/scripts',
				'!blocks/**/scripts/module*',
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
	);

const modulesConfig = new Config( modulesConfigWP, 'modules' );

module.exports = [ defaultConfig.get(), modulesConfig.get() ];
