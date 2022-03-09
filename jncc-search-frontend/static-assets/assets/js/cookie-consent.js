
var civicCookieControlConfig = {
    apiKey: 'fc8364648ad258321fa6197d91d72771562de378',
    product: 'PRO_MULTISITE',
    logConsent: true,
    initialState: 'notify',
    notifyDismissButton: false,
    acceptButton: false,
    rejectButton: false,
    setInnerHTML: true,
    closeStyle: 'button',
    text: {
        notifyTitle: '<span class="civic-cookie-banner-title">We use cookies</span>',
        notifyDescription: 'Some of these cookies are essential, while others help us to improve your experience by providing insights into how the site is being used or providing interactive content from third parties.'
            + ' Please read our <a href="https://jncc.gov.uk/about-jncc/corporate-information/cookie-policy/" class="civic-cookie-control-link">cookie notice</a> for more information.',
        accept: 'Accept all cookies',
        reject: 'Customise settings',
        title: 'We use cookies',
        settings: 'Customise settings',
        intro: '<p>Cookies are used on the jncc.gov.uk family of websites, some of them are essential, while others help us to improve your experience by providing insights into how the site is being. You can control our use of non-essential cookies below.</p>'
            + '<p>For more detailed information, please read our <a href="https://jncc.gov.uk/about-jncc/corporate-information/cookie-policy/" class="civic-cookie-control-link">cookie notice</a>.</p>',
        necessaryTitle: 'Essential cookies',
        necessaryDescription: 'Essential cookies enable core functionality. Some sections of the website cannot function without these cookies and can only be disabled by changing your browser preferences.',
        closeLabel: 'Close'  // closing doesn't actually *set* anything - settings already saved on toggle!
    },
    branding: {
        removeAbout: true,
        backgroundColor: '#222',
        toggleColor: '#3f9c35',
        fontFamily: '"Roboto", "Helvetica Neue", Helvetica, Arial, sans-serif',
        fontSize: '1em',
        fontSizeTitle: '2em'
    },
    optionalCookies: [
        {
            name: 'analytics',
            recommendedState: false,
            label: 'Analytics cookies',
            description: 'We like to use analytics cookies so we can understand how you use the service and make improvements.',
            cookies: ['_ga', '_gid', '_gat_UA-15841534-7', '_gat_UA-15841534-6', '_gat_gtag_UA_15841534_5', '_gat_UA-15841534-11'],
            onAccept: function () {

                dataLayer.push({ 'event': 'analytics_consent_accepted' });
            },
            onRevoke: function () {

                dataLayer.push({ 'event': 'analytics_consent_withdrawn' });

                // Disable Google Analytics from sending data
                window['ga-disable-UA-15841534-7'] = true;
                window['ga-disable-UA-15841534-6'] = true;
                window['ga-disable-UA-15841534-5'] = true;
                window['ga-disable-UA-15841534-11'] = true;

            }
        },
        {
            name: 'thirdParty',
            recommendedState: false,
            label: 'Third-party cookies',
            description: 'We embed related content from external video hosting providers such as vimeo.com and youtube.com and we also have embedded interactive documents from issuu.com',
            cookies: ['iutk', 'VISITOR_INFO1_LIVE', 'YSC', 'vuid']
        }
    ]
};

CookieControl.load(civicCookieControlConfig);