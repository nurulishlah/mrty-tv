<?php
/**
 * Plugin Name: MRTY TV
 * Description: Vue 3 digital signage display for Masjid Raya Taman Yasmin. Access via /signage
 * Version: 1.0.0
 * Author: Muhamad Ishlah
 * Text Domain: mrty-tv
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'MRTY_TV_PATH', plugin_dir_path( __FILE__ ) );
define( 'MRTY_TV_URL', plugin_dir_url( __FILE__ ) );
define( 'MRTY_TV_VERSION', '1.0.6' );

class MRTY_TV {

	/**
	 * Default prayer engine settings.
	 */
	const DEFAULTS = array(
		'approaching_mins' => 10,
		'adzan_duration'   => 2,
		'iqamah_duration'  => 10,
		'sholat_duration'  => 15,
		'adj_fajr'         => 0,
		'adj_sunrise'      => 0,
		'adj_dhuhr'        => 0,
		'adj_asr'          => 0,
		'adj_maghrib'      => 0,

		// Slider Limits
		'limit_slide'      => 10,
		'limit_video'      => 1, // Default to 1 (like wm-digisign)
		'limit_campaign'   => 1, // Default to 1 (like wm-digisign)
	);

	const HASH_TRANSIENT_KEY = 'mrty_tv_content_hash';

	public function __construct() {
		add_action( 'init', array( $this, 'add_endpoint' ) );
		add_action( 'template_redirect', array( $this, 'template_redirect' ) );
		add_filter( 'template_include', array( $this, 'load_template' ) );
		add_action( 'rest_api_init', array( $this, 'register_rest_routes' ) );
		add_action( 'admin_menu', array( $this, 'add_admin_menu' ) );
		add_action( 'admin_init', array( $this, 'register_settings' ) );

		// Invalidate content hash cache on relevant changes
		add_action( 'save_post', array( $this, 'invalidate_hash_cache' ) );
		add_action( 'delete_post', array( $this, 'invalidate_hash_cache' ) );
		add_action( 'update_option_mrty_tv_options', array( $this, 'invalidate_hash_cache' ) );
	}

	/**
	 * Delete the cached content hash so the next poll recomputes it.
	 */
	public function invalidate_hash_cache() {
		delete_transient( self::HASH_TRANSIENT_KEY );
	}

	public function add_endpoint() {
		add_rewrite_endpoint( 'signage', EP_ROOT );
	}

	public function template_redirect() {
		global $wp_query;
		if ( isset( $wp_query->query_vars['signage'] ) ) {
		}
	}

	public function load_template( $template ) {
		global $wp_query;
		if ( isset( $wp_query->query_vars['signage'] ) ) {
			$new_template = MRTY_TV_PATH . 'templates/signage-view.php';
			if ( file_exists( $new_template ) ) {
				return $new_template;
			}
		}
		return $template;
	}

	// -------------------------------------------------------
	// REST API
	// -------------------------------------------------------

	public function register_rest_routes() {
		register_rest_route( 'mrty-tv/v1', '/content-hash', array(
			'methods'             => 'GET',
			'callback'            => array( $this, 'get_content_hash' ),
			'permission_callback' => '__return_true',
		) );

		register_rest_route( 'mrty-tv/v1', '/settings', array(
			'methods'             => 'GET',
			'callback'            => array( $this, 'get_settings_api' ),
			'permission_callback' => '__return_true',
		) );

		register_rest_route( 'mrty-tv/v1', '/slides', array(
			'methods'             => 'GET',
			'callback'            => array( $this, 'get_slides_api' ),
			'permission_callback' => '__return_true',
		) );

		register_rest_route( 'mrty-tv/v1', '/running-text', array(
			'methods'             => 'GET',
			'callback'            => array( $this, 'get_running_text_api' ),
			'permission_callback' => '__return_true',
		) );
	}

	/**
	 * Return the content hash, cached as a transient for performance.
	 */
	public function get_content_hash() {
		$hash = get_transient( self::HASH_TRANSIENT_KEY );

		if ( false === $hash ) {
			$hash = $this->compute_content_hash();
			set_transient( self::HASH_TRANSIENT_KEY, $hash, 120 );
		}

		return rest_ensure_response( array(
			'hash' => $hash,
			'time' => current_time( 'mysql' ),
		) );
	}

	/**
	 * Return settings as JSON for reactive updates (no page reload).
	 */
	public function get_settings_api() {
		return rest_ensure_response( self::get_settings() );
	}

	/**
	 * Return slides data as JSON so Vue can render them reactively.
	 */
	public function get_running_text_api() {
		$texts = array();

		// 1. Static Custom Text
		$static_text = get_theme_mod( 'run_text', '' );
		if ( ! empty( $static_text ) ) {
			$texts[] = array(
				'type' => 'static',
				'text' => wp_strip_all_tags( $static_text ),
				'icon' => 'icofont-info-circle',
			);
		}

		// 2. Dynamic Posts (Pengumuman, Agenda, Infaq, Wakaf)
		$post_types = array(
			'pengumuman' => 'icofont-megaphone-alt',
			'agenda'     => 'icofont-calendar',
			'infaq'      => 'icofont-money',
			'wakaf'      => 'icofont-unity-hand',
			'sf_campaign' => 'icofont-heart-alt',
		);

		foreach ( $post_types as $pt => $icon ) {
			$posts = get_posts( array(
				'post_type'      => $pt,
				'posts_per_page' => 5, // Limit to latest 5 per type
				'post_status'    => 'publish',
				'orderby'        => 'date',
				'order'          => 'DESC',
			) );

			foreach ( $posts as $post ) {
				$texts[] = array(
					'type' => $pt,
					'text' => $post->post_title,
					'icon' => $icon,
				);
			}
		}

		return rest_ensure_response( $texts );
	}

	public function get_slides_api() {
		$slides  = array();
		$options = self::get_settings();

		// 1. Image Slides
		$image_slides = get_posts( array(
			'post_type'      => 'slide',
			'posts_per_page' => $options['limit_slide'],
			'post_status'    => 'publish',
			'orderby'        => 'menu_order',
			'order'          => 'ASC',
		) );
		foreach ( $image_slides as $slide ) {
			$thumb = get_the_post_thumbnail_url( $slide->ID, 'full' );
			if ( $thumb ) {
				$slides[] = array(
					'id'    => $slide->ID,
					'type'  => 'image',
					'src'   => $thumb,
					'title' => $slide->post_title,
				);
			}
		}

		// 2. Video Slides
		$video_slides = get_posts( array(
			'post_type'      => 'video',
			'posts_per_page' => $options['limit_video'],
			'post_status'    => 'publish',
			'orderby'        => 'date',
			'order'          => 'DESC',
		) );
		foreach ( $video_slides as $video ) {
			// Try meta first, then content regex
			$url = get_post_meta( $video->ID, 'video_embed', true );
			if ( ! $url && preg_match( '/https?:\/\/[^\s"]+/', $video->post_content, $matches ) ) {
				$url = $matches[0];
			}

			if ( $url ) {
				$slides[] = array(
					'id'    => $video->ID,
					'type'  => 'video',
					'src'   => esc_url( $url ),
					'title' => $video->post_title,
				);
			}
		}

		// 3. Campaign Slides
		if ( post_type_exists( 'sf_campaign' ) ) {
			$campaigns = get_posts( array(
				'post_type'      => 'sf_campaign',
				'posts_per_page' => $options['limit_campaign'],
				'post_status'    => 'publish',
				'orderby'        => 'date',
				'order'          => 'DESC',
			) );
			foreach ( $campaigns as $campaign ) {
				// Get collection data (using simple-fundraiser functions if available)
				$target    = (float) get_post_meta( $campaign->ID, '_sf_target_amount', true );
				$collected = (float) get_post_meta( $campaign->ID, '_sf_collected_amount', true );
				
				// QRIS & Bank Info
				$qris_id   = get_post_meta( $campaign->ID, '_sf_qris_image_id', true );
				$qris_url  = $qris_id ? wp_get_attachment_url( $qris_id ) : '';
				
				$slides[] = array(
					'id'        => $campaign->ID,
					'type'      => 'campaign',
					'title'     => $campaign->post_title,
					'src'       => get_the_post_thumbnail_url( $campaign->ID, 'full' ),
					'target'    => $target,
					'collected' => $collected,
					'qrisUrl'   => $qris_url,
					'bankName'  => get_post_meta( $campaign->ID, '_sf_bank_name', true ),
					'accNumber' => get_post_meta( $campaign->ID, '_sf_account_number', true ),
					'accHolder' => get_post_meta( $campaign->ID, '_sf_account_holder', true ),
				);
			}
		}
					'id'        => $campaign->ID,
					'type'      => 'campaign',
					'title'     => esc_html( $campaign->post_title ),
					'target'    => $target,
					'collected' => $collected,
					'progress'  => $target > 0 ? round( ( $collected / $target ) * 100, 1 ) : 0,
					'image'          => get_the_post_thumbnail_url( $campaign->ID, 'full' ),
					'qris'           => ( $qris_id = get_post_meta( $campaign->ID, '_sf_qris_image', true ) ) ? wp_get_attachment_url( $qris_id ) : '',
					'bank_name'      => get_post_meta( $campaign->ID, '_sf_bank_name', true ),
					'account_number' => get_post_meta( $campaign->ID, '_sf_account_number', true ),
					'account_holder' => get_post_meta( $campaign->ID, '_sf_account_holder', true ),
				);
			}
		}

		return rest_ensure_response( $slides );
	}

	/**
	 * Compute the content hash from all relevant data sources.
	 */
	private function compute_content_hash() {
		$hash_parts = array();

		$post_types = array( 'slide', 'video', 'sf_campaign', 'pengumuman', 'agenda', 'infaq', 'wakaf' );
		foreach ( $post_types as $pt ) {
			$posts = get_posts( array(
				'post_type'      => $pt,
				'posts_per_page' => 10,
				'orderby'        => 'modified',
				'order'          => 'DESC',
				'post_status'    => 'publish',
				'fields'         => 'ids',
			) );
			foreach ( $posts as $pid ) {
				$hash_parts[] = $pid . ':' . get_post_modified_time( 'U', true, $pid );
			}
		}

		$hash_parts[] = 'run_text:' . get_theme_mod( 'run_text', '' );

		foreach ( array( 'slide', 'video', 'sf_campaign' ) as $pt ) {
			$count = wp_count_posts( $pt );
			$hash_parts[] = $pt . '_count:' . ( isset( $count->publish ) ? $count->publish : 0 );
		}

		$settings = self::get_settings();
		$hash_parts[] = 'settings:' . md5( serialize( $settings ) );

		return md5( implode( '|', $hash_parts ) );
	}

	// -------------------------------------------------------
	// Admin Settings
	// -------------------------------------------------------

	public function add_admin_menu() {
		add_options_page(
			'MRTY TV',
			'MRTY TV',
			'manage_options',
			'mrty-tv',
			array( $this, 'render_settings_page' )
		);
	}

	public function register_settings() {
		register_setting( 'mrty_tv_settings', 'mrty_tv_options', array(
			'sanitize_callback' => array( $this, 'sanitize_settings' ),
			'default'           => self::DEFAULTS,
		) );

		add_settings_section(
			'mrty_tv_prayer_engine',
			'Prayer Engine',
			function () {
				echo '<p>Atur durasi untuk setiap tahapan waktu sholat pada Digital Signage.</p>';
			},
			'mrty-tv'
		);

		$fields = array(
			'approaching_mins' => array(
				'label' => 'Waktu Menjelang Sholat (menit)',
				'desc'  => 'Berapa menit sebelum waktu sholat layar menampilkan countdown besar.',
			),
			'adzan_duration' => array(
				'label' => 'Durasi Adzan (menit)',
				'desc'  => 'Berapa lama tampilan adzan ditampilkan.',
			),
			'iqamah_duration' => array(
				'label' => 'Durasi Iqamah (menit)',
				'desc'  => 'Berapa lama countdown iqamah ditampilkan setelah adzan.',
			),
			'sholat_duration' => array(
				'label' => 'Durasi Sholat (menit)',
				'desc'  => 'Berapa lama layar dimatikan (hitam) selama sholat berlangsung.',
			),
		);

		foreach ( $fields as $key => $field ) {
			add_settings_field(
				'mrty_tv_' . $key,
				$field['label'],
				function () use ( $key, $field ) {
					$options = self::get_settings();
					$val = isset( $options[ $key ] ) ? $options[ $key ] : self::DEFAULTS[ $key ];
					printf(
						'<input type="number" name="mrty_tv_options[%s]" value="%s" min="1" max="60" class="small-text" /> <span class="description">%s</span>',
						esc_attr( $key ),
						esc_attr( $val ),
						esc_html( $field['desc'] )
					);
				},
				'mrty-tv',
				'mrty_tv_prayer_engine'
			);
		}

		// --- Manual Coordinates Section ---
		add_settings_section(
			'mrty_tv_coordinates',
			'Koordinat Manual',
			function () {
				echo '<p>Isi jika ingin menggunakan koordinat manual (mengabaikan API). Kosongkan untuk auto-detect by ID Sholat.</p>';
			},
			'mrty-tv'
		);

		add_settings_field(
			'mrty_tv_latitude',
			'Latitude',
			function () {
				$options = self::get_settings();
				$val = isset( $options['latitude'] ) ? $options['latitude'] : '';
				printf(
					'<input type="text" name="mrty_tv_options[latitude]" value="%s" class="regular-text" placeholder="-6.200000" />',
					esc_attr( $val )
				);
			},
			'mrty-tv',
			'mrty_tv_coordinates'
		);

		add_settings_field(
			'mrty_tv_longitude',
			'Longitude',
			function () {
				$options = self::get_settings();
				$val = isset( $options['longitude'] ) ? $options['longitude'] : '';
				printf(
					'<input type="text" name="mrty_tv_options[longitude]" value="%s" class="regular-text" placeholder="106.816666" />',
					esc_attr( $val )
				);
			},
			'mrty-tv',
			'mrty_tv_coordinates'
		);

		// --- Slider Limits Section ---
		add_settings_section(
			'mrty_tv_slider_limits',
			'Limit Slider',
			function () {
				echo '<p>Batasi jumlah item yang ditampilkan di slider.</p>';
			},
			'mrty-tv'
		);

		add_settings_field(
			'mrty_tv_limit_slide',
			'Jumlah Slide Gambar',
			function () {
				$options = self::get_settings();
				printf(
					'<input type="number" name="mrty_tv_options[limit_slide]" value="%s" class="small-text" min="1" max="20" />',
					esc_attr( $options['limit_slide'] )
				);
			},
			'mrty-tv',
			'mrty_tv_slider_limits'
		);

		add_settings_field(
			'mrty_tv_limit_video',
			'Jumlah Video (Terbaru)',
			function () {
				$options = self::get_settings();
				printf(
					'<input type="number" name="mrty_tv_options[limit_video]" value="%s" class="small-text" min="0" max="10" />',
					esc_attr( $options['limit_video'] )
				);
			},
			'mrty-tv',
			'mrty_tv_slider_limits'
		);

		add_settings_field(
			'mrty_tv_limit_campaign',
			'Jumlah Campaign (Terbaru)',
			function () {
				$options = self::get_settings();
				printf(
					'<input type="number" name="mrty_tv_options[limit_campaign]" value="%s" class="small-text" min="0" max="10" />',
					esc_attr( $options['limit_campaign'] )
				);
			},
			'mrty-tv',
			'mrty_tv_slider_limits'
		);

		// --- Prayer Time Adjustment Section ---
		add_settings_section(
			'mrty_tv_time_adjust',
			'Koreksi Waktu Sholat',
			function () {
				echo '<p>Koreksi waktu sholat dalam menit. Nilai positif = mundurkan, negatif = majukan. Contoh: <code>+2</code> berarti mundur 2 menit.</p>';
			},
			'mrty-tv'
		);

		$adj_fields = array(
			'adj_fajr'    => 'Subuh',
			'adj_sunrise' => 'Terbit',
			'adj_dhuhr'   => 'Dzuhur',
			'adj_asr'     => 'Ashar',
			'adj_maghrib' => 'Maghrib',
			'adj_isha'    => 'Isya',
		);

		foreach ( $adj_fields as $key => $label ) {
			add_settings_field(
				'mrty_tv_' . $key,
				$label,
				function () use ( $key ) {
					$options = self::get_settings();
					$val = isset( $options[ $key ] ) ? $options[ $key ] : 0;
					printf(
						'<input type="number" name="mrty_tv_options[%s]" value="%s" min="-30" max="30" class="small-text" /> <span class="description">menit</span>',
						esc_attr( $key ),
						esc_attr( $val )
					);
				},
				'mrty-tv',
				'mrty_tv_time_adjust'
			);
		}
	}

	public function sanitize_settings( $input ) {
		$output = array();

		// Engine duration fields (positive only, 1-60)
		$duration_keys = array( 'approaching_mins', 'adzan_duration', 'iqamah_duration', 'sholat_duration' );
		foreach ( $duration_keys as $key ) {
			$output[ $key ] = isset( $input[ $key ] ) ? absint( $input[ $key ] ) : self::DEFAULTS[ $key ];
			if ( $output[ $key ] < 1 ) $output[ $key ] = self::DEFAULTS[ $key ];
			if ( $output[ $key ] > 60 ) $output[ $key ] = 60;
		}

		// Adjustment fields (can be negative, -30 to +30)
		$adj_keys = array( 'adj_fajr', 'adj_sunrise', 'adj_dhuhr', 'adj_asr', 'adj_maghrib', 'adj_isha' );
		foreach ( $adj_keys as $key ) {
			$output[ $key ] = isset( $input[ $key ] ) ? intval( $input[ $key ] ) : 0;
			$output[ $key ] = max( -30, min( 30, $output[ $key ] ) );
		}

		// Coordinates
		$output['latitude']  = isset( $input['latitude'] ) ? sanitize_text_field( $input['latitude'] ) : '';
		$output['longitude'] = isset( $input['longitude'] ) ? sanitize_text_field( $input['longitude'] ) : '';

		// Slider Limits
		$output['limit_slide']    = isset( $input['limit_slide'] ) ? absint( $input['limit_slide'] ) : 10;
		$output['limit_video']    = isset( $input['limit_video'] ) ? absint( $input['limit_video'] ) : 1;
		$output['limit_campaign'] = isset( $input['limit_campaign'] ) ? absint( $input['limit_campaign'] ) : 1;

		return $output;
	}

	public function render_settings_page() {
		if ( ! current_user_can( 'manage_options' ) ) return;
		?>
		<div class="wrap">
			<h1>MRTY TV Settings</h1>
			<form method="post" action="options.php">
				<?php
				settings_fields( 'mrty_tv_settings' );
				do_settings_sections( 'mrty-tv' );
				submit_button( 'Simpan Pengaturan' );
				?>
			</form>
			<hr>
			<p><a href="<?php echo esc_url( home_url( '/signage' ) ); ?>" target="_blank">🖥️ Buka Tampilan Signage &rarr;</a></p>
		</div>
		<?php
	}

	/**
	 * Get prayer engine settings with defaults.
	 */
	public static function get_settings() {
		$options = get_option( 'mrty_tv_options', array() );
		return wp_parse_args( $options, self::DEFAULTS );
	}

	// -------------------------------------------------------
	// Activation
	// -------------------------------------------------------

	public static function activate() {
		add_rewrite_endpoint( 'signage', EP_ROOT );
		flush_rewrite_rules();
	}
}

$mrty_tv = new MRTY_TV();
register_activation_hook( __FILE__, array( 'MRTY_TV', 'activate' ) );
register_deactivation_hook( __FILE__, 'flush_rewrite_rules' );
