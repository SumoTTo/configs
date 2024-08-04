const WRAP_SELECTOR = ':is(.is-root-container,.wp-site-blocks)';

function isRoot( selector ) {
	for ( const root of [ 'html', 'body', ':root', ':host' ] ) {
		if ( root === selector || selector.startsWith( root + ' ' ) ) {
			return true;
		}
	}

	return false;
}

function wrap( selector ) {
	return isRoot( selector ) ? selector : WRAP_SELECTOR + ' ' + selector;
}

const plugin = () => {
	return {
		postcssPlugin: 'postcss-wrap-selector',
		Rule( rule ) {
			if (
				rule.parent &&
				rule.parent.type === 'atrule' &&
				rule.parent.name === 'keyframes'
			) {
				return;
			}

			rule.selectors = rule.selectors.map( wrap );
		},
	};
};

plugin.postcss = true;

module.exports = plugin;
