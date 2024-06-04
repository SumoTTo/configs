const MiniCSSExtractPlugin = require( 'mini-css-extract-plugin' );
const RtlCssPlugin = require( 'rtlcss-webpack-plugin' );
const { CleanWebpackPlugin } = require( 'clean-webpack-plugin' );
const {
	Config,
	defaultConfigWP,
	modulesConfigWP,
} = require( '../helpers/webpack' );

const defaultConfig = new Config(
	defaultConfigWP,
	'default',
	process.env.THEME_BLOCK_DEV_SERVER_PORT || 'auto'
)
	.addEntries( 'src/**/styles/*.{pc,sc,sa,c}ss' )
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
			cleanOnceBeforeBuildPatterns: [ '!**/*module*,' ],
			cleanStaleWebpackAssets: false,
		} ),
		'before'
	);

const modulesConfig = new Config( modulesConfigWP, 'modules' );

module.exports = [ defaultConfig.get(), modulesConfig.get() ];
