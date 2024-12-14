const path = require( 'node:path' );
const glob = require( 'glob' );
const fs = require( 'fs' );
const browserslist = require( 'browserslist' );

require( 'dotenv' ).config( {
	path: [
		path.resolve( process.cwd(), '.env.local' ),
		path.resolve( process.cwd(), '.env' ),
		path.resolve( process.cwd(), '../.env.local' ),
		path.resolve( process.cwd(), '../.env' ),
		path.resolve( process.cwd(), '../../.env.local' ),
		path.resolve( process.cwd(), '../../.env' ),
		path.resolve( process.cwd(), '../../../.env.local' ),
		path.resolve( process.cwd(), '../../../.env' ),
	],
} );

const browserslistConfig = browserslist.findConfig( process.cwd() );
if ( ! browserslistConfig ) {
	process.env.BROWSERSLIST =
		'> 0.05% in US and last 3 years, not dead, not UCAndroid > 0, not OperaMini all, not and_qq > 0, not kaios > 0';
}

const [
	defaultConfigWP,
	modulesConfigWP,
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

function getEntries( globPattern ) {
	return glob
		.sync( globPattern, {
			absolute: true,
			cwd: process.cwd(),
		} )
		.reduce( function ( entries, entryPath ) {
			if ( fs.statSync( entryPath ).size > 0 ) {
				entries[ getEntryName( entryPath ) ] = entryPath;
			}
			return entries;
		}, {} );
}

module.exports.defaultConfigWP = defaultConfigWP;
module.exports.modulesConfigWP = modulesConfigWP;

module.exports.Config = class {
	constructor( config, name, port = 'auto' ) {
		this.config = { ...config };
		this.config.name = name;
		this.entries = {};
		this.entriesFunctions = [];

		if ( typeof this.config.entry === 'function' ) {
			this.entriesFunctions.push( this.config.entry );
		} else {
			this.entries = {
				...this.config.entry,
			};
		}

		this.config.entry = () => {
			let entries = {};

			for ( const entriesFunction of this.entriesFunctions ) {
				entries = {
					...entries,
					...entriesFunction(),
				};
			}

			return {
				...this.entries,
				...entries,
			};
		};

		if ( config.devServer ) {
			// noinspection JSUnusedGlobalSymbols
			this.config.devServer = {
				...config.devServer,
				port,
				allowedHosts: 'all',
				client: {
					...config.devServer?.client,
					overlay: {
						...config.devServer?.client?.overlay,
						runtimeErrors: ( error ) => {
							return (
								error?.message !==
								'ResizeObserver loop completed with undelivered notifications.'
							);
						},
					},
				},
				watchFiles: [ 'src/scripts/modules/*' ],
			};

			this.config.optimization = {
				...config.optimization,
				runtimeChunk: 'single',
			};
		}
	}

	get() {
		return this.config;
	}

	resetEntries() {
		this.entries = {};
		this.entriesFunctions = [];

		return this;
	}

	addEntries( globPattern ) {
		this.entriesFunctions.push( () => getEntries( globPattern ) );

		return this;
	}

	changeRule( test, callBack ) {
		this.config.module.rules.forEach( ( rule, index ) => {
			if ( test === rule.test.toString() ) {
				callBack( rule, index );
			}
		} );

		return this;
	}

	removePlugin( pluginClass ) {
		this.config.plugins.forEach( ( plugin, number ) => {
			if ( plugin instanceof pluginClass ) {
				this.config.plugins.splice( number, 1 );
			}
		} );

		return this;
	}

	addPlugin( plugin, position = 'after' ) {
		if ( typeof this.config.plugins === 'undefined' ) {
			this.config.plugins = [];
		}

		if ( 'before' === position ) {
			this.config.plugins.unshift( plugin );
		} else {
			this.config.plugins.push( plugin );
		}

		return this;
	}

	replacePlugin( newPlugin ) {
		this.config.plugins.forEach( ( plugin, index ) => {
			if ( plugin instanceof newPlugin.constructor ) {
				this.config.plugins[ index ] = newPlugin;
			}
		} );

		return this;
	}

	addMinimizer( minimizer ) {
		if ( typeof this.config.optimization === 'undefined' ) {
			this.config.optimization = {};
		}

		if ( typeof this.config.optimization.minimizer === 'undefined' ) {
			this.config.optimization.minimizer = [];
		}

		this.config.optimization.minimizer.push( minimizer );

		return this;
	}

	addWatch( globPattern ) {
		if ( this.config.devServer ) {
			this.config.devServer = {
				...this.config.devServer,
				watchFiles: [
					...this.config.devServer?.watchFiles,
					globPattern,
				],
			};
		}

		return this;
	}

	static hasDevServer( config ) {
		return !! config.devServer;
	}
};
