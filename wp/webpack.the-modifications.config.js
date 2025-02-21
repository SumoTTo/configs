const RtlCssPlugin = require( '@wordpress/scripts/plugins/rtlcss-webpack-plugin' );
const glob = require( 'glob' );
const path = require( 'path' );

require( 'dotenv' ).config( {
	path: [
		path.resolve( process.cwd(), '.env.local' ),
		path.resolve( process.cwd(), '.env' ),
		path.resolve( process.cwd(), '../.env.local' ),
		path.resolve( process.cwd(), '../.env' ),
		path.resolve( process.cwd(), '../../.env.local' ),
		path.resolve( process.cwd(), '../../.env' ),
	],
} );

const [
	defaultConfig,
	modulesConfig,
] = require( '@wordpress/scripts/config/webpack.config.js' );

function getEntryName( entryPath ) {
	const entryData = path.parse( entryPath );
	return path
		.normalize(
			path.join(
				path.relative(
					path.join( process.cwd(), 'src' ),
					entryData.dir
				),
				entryData.name
			)
		)
		.replaceAll( '\\', '/' );
}

function getEntries( globPattern, replace = '' ) {
	return glob
		.sync( globPattern, {
			absolute: true,
			cwd: process.cwd(),
		} )
		.reduce( function ( entries, entryPath ) {
			let name = getEntryName( entryPath ).replace( /^scripts\//, '' );
			if ( replace ) {
				name = name.replace( replace, '' );
			}

			entries[ name ] = entryPath;

			return entries;
		}, {} );
}

defaultConfig.entry = {
	...getEntries( 'src/*.{j,t}s{,x}' ),
};

defaultConfig.plugins.forEach( ( plugin, number ) => {
	if ( plugin instanceof RtlCssPlugin ) {
		defaultConfig.plugins.splice( number, 1 );
	}
} );

modulesConfig.entry = {
	...getEntries( 'src/scripts/modules/*.{j,t}s', 'modules/' ),
};

defaultConfig.name = 'default';
modulesConfig.name = 'modules';

defaultConfig.output.path = path.resolve( process.cwd(), 'build/scripts' );
modulesConfig.output.path = path.resolve( process.cwd(), 'build/modules' );

const reactJSXRuntimeConfig = {
	name: 'react',
	mode: defaultConfig.mode,
	entry: {
		'react-jsx-runtime': {
			import: 'react/jsx-runtime',
		},
	},
	output: {
		path: path.resolve( process.cwd(), 'build/polyfill' ),
		filename: 'react-jsx-runtime.js',
		library: {
			name: 'ReactJSXRuntime',
			type: 'window',
		},
	},
	externals: {
		react: 'React',
	},
};

module.exports = [ defaultConfig, modulesConfig, reactJSXRuntimeConfig ];
