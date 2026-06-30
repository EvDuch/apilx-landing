<?php
/**
 * Plugin Name: Cost Calculator Builder
 * Plugin URI: https://wordpress.org/plugins/cost-calculator-builder/
 * Description: WP Cost Calculator helps you to build any type of estimation forms on a few easy steps. The plugin offers its own calculation builder.
 * Author: StylemixThemes
 * Author URI: https://stylemixthemes.com/
 * License: GNU General Public License v2 or later
 * License URI: http://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: cost-calculator-builder
 * Version: 3.6.17
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'CALC_DIR', __DIR__ );
define( 'CALC_FILE', __FILE__ );
define( 'CALC_VERSION', '3.6.17' );
define( 'CALC_WP_TESTED_UP', '6.9' );
define( 'CALC_DB_VERSION', '3.6.15' );
define( 'CALC_PATH', dirname( CALC_FILE ) );
define( 'CALC_URL', plugins_url( '', CALC_FILE ) );

/*** mailchimp integration */
if ( is_admin() ) {
	if ( file_exists( CALC_DIR . '/includes/lib/stm-mailchimp-integration/stm-mailchimp.php' ) ) {
		require_once CALC_DIR . '/includes/lib/stm-mailchimp-integration/stm-mailchimp.php';

		$plugin_pages   = array(
			'cost_calculator_builder',
			'page' => 'cost_calculator_orders',
			'stm-support-page-ccb',
		);
		$plugin_actions = array(
			'stm_mailchimp_integration_add_cost-calculator-builder',
			'stm_mailchimp_integration_remove_cost-calculator-builder',
			'stm_mailchimp_integration_not_allowed_cost-calculator-builder',
		);

		if ( stm_mailchimp_is_show_page( $plugin_actions, $plugin_pages, array() ) !== false ) {

			if ( ! function_exists( 'is_plugin_active' ) ) {
				include_once ABSPATH . 'wp-admin/includes/plugin.php';
			}

			add_action( 'plugins_loaded', 'init_mailchimp', 10, 1 );
			function init_mailchimp() {
				$installed_plugins = get_plugins();
				$pro_slug          = 'cost-calculator-builder-pro/cost-calculator-builder-pro.php';
				$is_pro_exist      = array_key_exists( $pro_slug, $installed_plugins ) || in_array( $pro_slug, $installed_plugins, true );

				$init_data = array(
					'plugin_title' => 'Cost Calculator',
					'plugin_name'  => 'cost-calculator-builder',
					'is_pro'       => $is_pro_exist,
				);
				if ( function_exists( 'wp_get_current_user' ) ) {
					stm_mailchimp_admin_init( $init_data );
				}
			}
		}
	}
}

/*** mailchimp integration | end */

if ( is_admin() ) {
	require_once CALC_PATH . '/includes/lib/admin-notices/admin-notices.php';
	require_once CALC_PATH . '/includes/admin/enqueue.php';
	require_once CALC_PATH . '/includes/admin/item-announcements.php';
	require_once CALC_PATH . '/includes/classes/CCBBuilderAdminMenu.php';
	require_once CALC_PATH . '/includes/admin/support-page-integration.php';
}

require_once CALC_PATH . '/includes/functions.php';
require_once CALC_PATH . '/includes/helpers/sanitizer/svg-scanner.php';
require_once CALC_PATH . '/includes/classes/old_custom_fields/autoload.php';
require_once CALC_PATH . '/includes/classes/CCBContactFormSeven.php';
require_once CALC_PATH . '/includes/classes/CCBUpdates.php';
require_once CALC_PATH . '/includes/classes/CCBUpdatesCallbacks.php';
require_once CALC_PATH . '/includes/classes/CCBSettingsData.php';
require_once CALC_PATH . '/includes/classes/CCBAjaxCallbacks.php';
require_once CALC_PATH . '/includes/classes/CCBAjaxAction.php';
require_once CALC_PATH . '/includes/classes/pdf-manager/CCBPdfManagerHelper.php';
require_once CALC_PATH . '/includes/classes/pdf-manager/CCBPdfManagerTemplates.php';
require_once CALC_PATH . '/includes/classes/pdf-manager/CCBPdfManager.php';
require_once CALC_PATH . '/includes/classes/CCBCalculators.php';
require_once CALC_PATH . '/includes/classes/CCBCalculatorTemplates.php';
require_once CALC_PATH . '/includes/classes/CCBCategory.php';
require_once CALC_PATH . '/includes/classes/CCBExportImport.php';
require_once CALC_PATH . '/includes/classes/CCBTemplate.php';
require_once CALC_PATH . '/includes/classes/CCBTranslations.php';
require_once CALC_PATH . '/includes/classes/appearance/CCBCssLoader.php';
require_once CALC_PATH . '/includes/classes/CCBFrontController.php';
require_once CALC_PATH . '/includes/classes/CCBDiscountController.php';
require_once CALC_PATH . '/includes/classes/CCBOrderController.php';
require_once CALC_PATH . '/includes/classes/CCBAdminActions.php';
require_once CALC_PATH . '/includes/classes/CCBEmbedCalculator.php';
require_once CALC_PATH . '/includes/classes/CCBForms.php';
require_once CALC_PATH . '/includes/classes/OrdersPatch.php';
require_once CALC_PATH . '/includes/classes/vendor/DataBaseModel.php';
require_once CALC_PATH . '/includes/classes/models/Orders.php';
require_once CALC_PATH . '/includes/classes/models/CalcOrders.php';
require_once CALC_PATH . '/includes/classes/models/OrdersStatuses.php';
require_once CALC_PATH . '/includes/classes/models/OrdersPayments.php';
require_once CALC_PATH . '/includes/classes/models/OrdersFormsDetails.php';
require_once CALC_PATH . '/includes/classes/models/OrdersCalculatorFields.php';
require_once CALC_PATH . '/includes/classes/models/OrdersCalcBasicFields.php';
require_once CALC_PATH . '/includes/classes/models/OrdersCalcFieldsAttrs.php';
require_once CALC_PATH . '/includes/classes/models/OrdersCalcFieldsMultiOptions.php';
require_once CALC_PATH . '/includes/classes/models/OrdersTotals.php';
require_once CALC_PATH . '/includes/classes/models/OrdersCurrency.php';
require_once CALC_PATH . '/includes/classes/models/OrdersDiscounts.php';
require_once CALC_PATH . '/includes/classes/models/OrdersPromocodes.php';
require_once CALC_PATH . '/includes/classes/models/OrdersNotes.php';
require_once CALC_PATH . '/includes/classes/models/Forms.php';
require_once CALC_PATH . '/includes/classes/models/FormFields.php';
require_once CALC_PATH . '/includes/classes/models/FormFieldsAttributes.php';
require_once CALC_PATH . '/includes/classes/models/Payments.php';
require_once CALC_PATH . '/includes/classes/models/Discounts.php';
require_once CALC_PATH . '/includes/classes/models/Condition.php';
require_once CALC_PATH . '/includes/classes/models/AnalyticsViews.php';
require_once CALC_PATH . '/includes/classes/models/AnalyticsInteractions.php';
require_once CALC_PATH . '/includes/classes/models/Promocodes.php';
require_once CALC_PATH . '/includes/helpers/CCBCleanHelper.php';
require_once CALC_PATH . '/includes/helpers/CCBConditionsHelper.php';
require_once CALC_PATH . '/includes/helpers/CCBFieldsHelper.php';
require_once CALC_PATH . '/includes/helpers/CCBOrderFormFieldsHelper.php';
require_once CALC_PATH . '/includes/helpers/vite-integration.php';
require_once CALC_PATH . '/includes/classes/appearance/autoload.php';
require_once CALC_PATH . '/widgets/CCB_VC.php';
require_once CALC_PATH . '/includes/widget.php';
require_once CALC_PATH . '/includes/gutenberg-block/gutenberg-block.php';
require_once CALC_PATH . '/includes/install.php';
require_once CALC_PATH . '/includes/init.php';
require_once CALC_PATH . '/includes/mixpanel/mixpanel_init.php';


if ( is_admin() && defined( 'CCB_PRO_VERSION' ) !== false && version_compare( CCB_PRO_VERSION, '2.1.9', '<' ) ) {
	$init_data = array(
		'notice_type'          => 'animate-circle-notice',
		'notice_logo'          => 'attent_circle.svg',
		'notice_title'         => esc_html__( 'Please update Cost Calculator Builder plugin!', 'cost-calculator-builder' ),
		'notice_desc'          => esc_html__( 'Cost Calculator Builder Pro plugin update required. We added new features, and need to update your plugin to the latest version!', 'cost-calculator-builder' ),
		'notice_btn_one'       => admin_url( 'plugins.php' ),
		'notice_btn_one_title' => esc_html__( 'Update Plugin', 'cost-calculator-builder' ),
	);

	stm_admin_notices_init( $init_data );

	return;
}
