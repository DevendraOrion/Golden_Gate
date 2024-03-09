const dotenv = require('dotenv');
dotenv.config();

const config = function () {
    this.project_name = process.env.PROJECT_NAME;
    this.port = process.env.PORT;
    this.pre = process.env.PRE;
    this.path_types = {
        absolute: 0,
        relative: 1
    };
    this.path = this.path_types.relative;
    this.distributorBase = process.env.DISTRIBUTOR_BASE

    this.dummyMoves = process.env.dummyMoves || false;
    this.masterPassword = 'masterPassForThisProject';

    switch (process.env.NODE_ENV) {
        case 'local':
            this.dbConnectionUrl = process.env.MONGO_LOCAL;
            break;
        case 'staging':
            this.dbConnectionUrl = process.env.MONGO_STAG;
            break;
        case 'production':
            this.dbConnectionUrl = process.env.MONGO_PROD;
            break;
        case 'development':
            this.dbConnectionUrl = process.env.MONGO_DEV;
            break;
        default:
            this.dbConnectionUrl = process.env.MONGO_LOCAL;
    }

    this.OPT_EXPIRED_IN_MINUTES = 15;
    this.EMAIL_LINK_EXPIRED_IN_MINUTES = 30;

    this.cryptrSecret = 'someRandomStringWhichIsSecretAndUnique&avsdhjgasvhj';
    this.apiSecret = 'someRandomStringWhichIsSecretAndUnique&sdashjdbhbshdcas';
    this.sessionSecret = 'someRandomStringWhichIsSecretAndUnique&dhayduwahwkah';

    this.SMTPConfig = {
        host: 'smtp.mailgun.org',
        port: 465,
        secure: true,
        auth: {
            user: 'postmaster@app.ludoshudo.com', // email_address
            pass: 'cf9eefafc985793a3dae568951bfb940-2a9a428a-7babd056' // email_password
        }
    }

    this.reset_email = {
        host: 'smtp.gmail.com', //smtp.gmail.com
        port: 587,
        secure: false,
        auth: {
            user: 'gameindia.online@gmail.com', // email_address
            pass: 'qoxbtnyhyappzlua' // email_password
        }
    };
    this.support_email = 'gameindia.online@gmail.com';
    this.support_number = '8147365894';

    this.AWS_S3_BUCKET = {
        key: 'AKIAZB6QH4SHJUH6NL4R',
        secret: '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',
        name: 'ludo-shudo',
        region: 'ap-south-1'
    };
    this.AWS_kYC_S3_BUCKET = {
        key: 'AKIA3RCVEIYM2YOUUYMA',
        secret: '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',
        name: 'ludo-shudo',
        region: 'ap-south-1'
    };

    this.ONESIGNAL_APP_ID = '413b3c98-2478-4267-b1d9-b4e71849f2b7';

    this.AWS_S3_DB_BUCKET = {
        key: 'xxxxxxx',
        secret: 'xxxxxxx',
        name: 'xxxxxxx',
        region: 'xxxxxxx'
    };

    //For OTP SMS
    this.textLocalKey = {
        apikey: 'xxxx',
        sender: 'xxxx'
    };

    this.VPS_RAJA_SMS = {
        url: 'https://vpsraja.com/api/sms',
        auth: '/api_login',
        send_sms: '/send_sms',
        username: "xxxx",
        password: "xxxxx",
        sender_id: "xxxxx"
    }
    // this.api_root="http://localhost:3000/";
    this.api_root = "http://103.175.163.97:3006/";
    this.default_user_pic = 'http://103.175.163.97:3001/images/user-avatar.png';
    this.logo_img = 'http://103.175.163.97:3001/images/logo.png';
    this.otp_length = 6;
    this.otp_continuous_false_limit = 3;
    this.otp_send_limit = 10;
    this.live_url = process.env.ADMIN_BASE;

    this.secret_session_data =
        'SomeSecretDataOfAPItoAccessInMaintenanceModez86BCwN4ORqj24rRmVm7GzGqogj8A33UVNUfPU43i6Q8vPoWNvw8QMSHqnzxwBZ0W1ZbWI7Qx4MqRvwQOkGqmzEsv5BmiDgoulROFB1T5Vk51UhV9U55tnLBMnpbMy9ozPUCROgL4r3NwcIMWRe3hT1KKKDKUOtRPefOiUxn3btx6D1vtgn9tFwgwbiGR4y3GRDal6U5';

    this.referral_earn_max_limit = 500;
    this.referral_amount_per_match = 1;

    //For PAYTM API
    // STAGING
    this.PAYTM_STAGING = {
        URL: 'https://securegw-stage.paytm.in',
        MID: 'mzyFCc70630473035571',
        MERCHANT_KEY: '&RembA7Ps7bEmSNy',
        WEBSITE: 'WEBSTAGING',
        CHANNEL_ID: 'WEB',
        INDUSTRY_TYPE_ID: 'Retail'
    };
    // PRODUCTION
    this.PAYTM_PROD = {
        URL: 'https://securegw.paytm.in',
        MID: 'mzyFCc70630473035571',
        MERCHANT_KEY: '&RembA7Ps7bEmSNy',
        WEBSITE: 'DEFAULT',
        CHANNEL_ID: 'WEB',
        INDUSTRY_TYPE_ID: 'Retail'
    };
    this.PAYTM = {
        URL: process.env.PAYMENT_MODE == 'LIVE' ? this.PAYTM_PROD.URL : this.PAYTM_STAGING.URL,
        MID: process.env.PAYMENT_MODE == 'LIVE' ? this.PAYTM_PROD.MID : this.PAYTM_STAGING.MID,
        MERCHANT_KEY:
            process.env.PAYMENT_MODE == 'LIVE' ? this.PAYTM_PROD.MERCHANT_KEY : this.PAYTM_STAGING.MERCHANT_KEY,
        WEBSITE: process.env.PAYMENT_MODE == 'LIVE' ? this.PAYTM_PROD.WEBSITE : this.PAYTM_STAGING.WEBSITE,
        CHANNEL_ID: process.env.PAYMENT_MODE == 'LIVE' ? this.PAYTM_PROD.CHANNEL_ID : this.PAYTM_STAGING.CHANNEL_ID,
        INDUSTRY_TYPE_ID:
            process.env.PAYMENT_MODE == 'LIVE' ? this.PAYTM_PROD.INDUSTRY_TYPE_ID : this.PAYTM_STAGING.INDUSTRY_TYPE_ID,
        PROCESS_TRANSACTION: '/order/process',
        CHECK_TRANSACTION_STATUS: '/order/status'
    };

    this.MOVE_PATH = [
        [
            1,
            2,
            3,
            4,
            5,
            6,
            7,
            8,
            9,
            10,
            11,
            12,
            13,
            14,
            15,
            16,
            17,
            18,
            19,
            20,
            21,
            22,
            23,
            24,
            25,
            26,
            27,
            28,
            29,
            30,
            31,
            32,
            33,
            34,
            35,
            36,
            37,
            38,
            39,
            40,
            41,
            42,
            43,
            44,
            45,
            46,
            47,
            48,
            49,
            50,
            51,
            52,
            53,
            54,
            55,
            56,
            57
        ],
        [
            14,
            15,
            16,
            17,
            18,
            19,
            20,
            21,
            22,
            23,
            24,
            25,
            26,
            27,
            28,
            29,
            30,
            31,
            32,
            33,
            34,
            35,
            36,
            37,
            38,
            39,
            40,
            41,
            42,
            43,
            44,
            45,
            46,
            47,
            48,
            49,
            50,
            51,
            58,
            1,
            2,
            3,
            4,
            5,
            6,
            7,
            8,
            9,
            10,
            11,
            12,
            59,
            60,
            61,
            62,
            63,
            64
        ],
        [
            27,
            28,
            29,
            30,
            31,
            32,
            33,
            34,
            35,
            36,
            37,
            38,
            39,
            40,
            41,
            42,
            43,
            44,
            45,
            46,
            47,
            48,
            49,
            50,
            51,
            58,
            1,
            2,
            3,
            4,
            5,
            6,
            7,
            8,
            9,
            10,
            11,
            12,
            13,
            14,
            15,
            16,
            17,
            18,
            19,
            20,
            21,
            22,
            23,
            24,
            25,
            65,
            66,
            67,
            68,
            69,
            70
        ],
        [
            40,
            41,
            42,
            43,
            44,
            45,
            46,
            47,
            48,
            49,
            50,
            51,
            58,
            1,
            2,
            3,
            4,
            5,
            6,
            7,
            8,
            9,
            10,
            11,
            12,
            13,
            14,
            15,
            16,
            17,
            18,
            19,
            20,
            21,
            22,
            23,
            24,
            25,
            26,
            27,
            28,
            29,
            30,
            31,
            32,
            33,
            34,
            35,
            36,
            37,
            38,
            71,
            72,
            73,
            74,
            75,
            76
        ]
    ];

    this.safeZone = [1, 9, 14, 22, 27, 35, 40, 48];

    this.defaultPosition = [-1, -1, -1, -1];

    this.roomFees = [10, 20, 50, 100, 150, 200, 300, 500, 1000, 1500, 2000, 3000];

    this.noOfPlayersInPrivate = [2, 3, 4];

    this.noOfPlayersInPublic = [2, 3, 4];

    this.WinPriceDistribution = {
        2: {
            10: {
                per_game: 20,
                winners: [16, -10, -10, -10],
                commission: 4
            },
            20: {
                per_game: 40,
                winners: [36, -20, -20, -20],
                commission: 6
            },
            50: {
                per_game: 100,
                winners: [90, -50, -50, -50],
                commission: 10
            },
            100: {
                per_game: 200,
                winners: [180, -100, -100, -100],
                commission: 20
            },
            150: {
                per_game: 300,
                winners: [270, -150, -150, -150],
                commission: 30
            },
            200: {
                per_game: 400,
                winners: [360, -200, -200, -200],
                commission: 40
            },
            300: {
                per_game: 600,
                winners: [540, -300, -300, -300],
                commission: 60
            },
            500: {
                per_game: 1000,
                winners: [900, -500, -500, -500],
                commission: 100
            },
            1000: {
                per_game: 2000,
                winners: [1800, -1000, -1000, -1000],
                commission: 200
            },
            1500: {
                per_game: 3000,
                winners: [2700, -1500, -1500, -1500],
                commission: 300
            },
            2000: {
                per_game: 4000,
                winners: [3600, -2000, -2000, -2000],
                commission: 400
            },
            3000: {
                per_game: 6000,
                winners: [5400, -3000, -3000, -3000],
                commission: 600
            }
        },
        3: {
            10: {
                per_game: 30,
                winners: [24, -10, -10, -10],
                commission: 6
            },
            20: {
                per_game: 60,
                winners: [52, -20, -20, -20],
                commission: 8
            },
            50: {
                per_game: 150,
                winners: [130, -50, -50, -50],
                commission: 20
            },
            100: {
                per_game: 300,
                winners: [260, -100, -100, -100],
                commission: 40
            },
            150: {
                per_game: 450,
                winners: [390, -150, -150, -150],
                commission: 60
            },
            200: {
                per_game: 600,
                winners: [520, -200, -200, -200],
                commission: 80
            },
            300: {
                per_game: 900,
                winners: [780, -300, -300, -300],
                commission: 120
            },
            500: {
                per_game: 1500,
                winners: [1300, -500, -500, -500],
                commission: 200
            },
            1000: {
                per_game: 3000,
                winners: [2600, -1000, -1000, -1000],
                commission: 400
            },
            1500: {
                per_game: 4500,
                winners: [3900, -1500, -1500, -1500],
                commission: 600
            },
            2000: {
                per_game: 6000,
                winners: [5200, -2000, -2000, -2000],
                commission: 800
            },
            3000: {
                per_game: 9000,
                winners: [7800, -3000, -3000, -3000],
                commission: 1200
            }
        },
        4: {
            10: {
                per_game: 40,
                winners: [32, -10, -10, -10],
                commission: 8
            },
            20: {
                per_game: 80,
                winners: [68, -20, -20, -20],
                commission: 12
            },
            50: {
                per_game: 200,
                winners: [170, -50, -50, -50],
                commission: 30
            },
            100: {
                per_game: 400,
                winners: [340, -100, -100, -100],
                commission: 60
            },
            150: {
                per_game: 600,
                winners: [510, -150, -150, -150],
                commission: 90
            },
            200: {
                per_game: 800,
                winners: [680, -200, -200, -200],
                commission: 120
            },
            300: {
                per_game: 1200,
                winners: [1020, -300, -300, -300],
                commission: 180
            },
            500: {
                per_game: 2000,
                winners: [1700, -500, -500, -500],
                commission: 300
            },
            1000: {
                per_game: 4000,
                winners: [3400, -1000, -1000, -1000],
                commission: 600
            },
            1500: {
                per_game: 6000,
                winners: [5100, -1500, -1500, -1500],
                commission: 900
            },
            2000: {
                per_game: 8000,
                winners: [6800, -2000, -2000, -2000],
                commission: 1200
            },
            3000: {
                per_game: 12000,
                winners: [10200, -3000, -3000, -3000],
                commission: 1800
            }
        }
    };

    this.ADMIN_ROLES = {
        // DASHBOARD: 'DASHBOARD',
        // USER_MANAGEMENT: 'USER_MANAGEMENT',
        // ALL: 'ALL',
        Company: 'Company',
        State:"State",
        District:"District",
        Zone:"Zone",
        Agent:"Agent",
        User:"User"
    };

    this.ADMIN_ACCESS = {
        NONAUTHORIZED_ONLY: ['/admin/login'],
        FREE_ROUTES: ['/admin/404', '/admin/401'],
        DASHBOARD: [
            '/',
            '/admin',
            '/profile',
            '/admin/logout',
            '/admin/adminpass',
            '/admin/genprofile'
        ],
        USER_MANAGEMENT: [
            '/',
            '/admin',
            '/profile',
            '/admin/logout',
            '/user',
            '/user/view',
            '/users_ajax',
            '/users/change_status',
            '/admin/users/change_status',
            '/admin/addmoney',
            '/admin/deductmoney',
            '/admin/users/changeuserpass',
            '/admin/adminpass',
            '/admin/genprofile',
            '/admin/users/manually_verify'
        ]
    };

    this.ref_bonus = 5;
    this.signup_bonus = 5;

    this.paytm_min_withdraw_limit = 50;
    this.bank_min_withdraw_limit = 300;

    //For CASHFREE
    // STAGING
    // STAGING
    this.CASHFREE_STAGING = {
        URL: 'https://test.cashfree.com/billpay',
        APPID: '3935018bc1ff25cd5331d57c705393',
        SECRET: '3d568395087a5bd0a41fb0f8d8f880d1c7eb3a2f'
    };
    // PRODUCTION
    this.CASHFREE_PROD = {
        URL: 'https://www.cashfree.com',
        APPID: '835008fcdaa16c04ae3ceea0000538',
        SECRET: 'eb2b89f4574f803204e171494155953a44ca9576'
    };
    this.CASHFREE = {
        URL: process.env.PAYMENT_MODE == 'LIVE' ? this.CASHFREE_PROD.URL : this.CASHFREE_STAGING.URL,
        APPID: process.env.PAYMENT_MODE == 'LIVE' ? this.CASHFREE_PROD.APPID : this.CASHFREE_STAGING.APPID,
        SECRET: process.env.PAYMENT_MODE == 'LIVE' ? this.CASHFREE_PROD.SECRET : this.CASHFREE_STAGING.SECRET,
        PAYMENT_MODE: '',
        PROCESS_TRANSACTION: '/checkout/post/submit',
        RETURN_URL: process.env.ADMIN_BASE + '/response',
        NOTIFY_URL: process.env.ADMIN_BASE + '/payment_notify'
    };

    this.payment_modes = { 'PA': 'PA', 'DEBIT_CARD': 'DEBIT_CARD', 'CREDIT_CARD': 'CREDIT_CARD', 'CREDIT_CARD_EMI': 'CREDIT_CARD_EMI', 'NET_BANKING': 'NET_BANKING', 'UPI': 'UPI', 'Paypal': 'Paypal', 'PhonePe': 'PhonePe', 'Paytm': 'Paytm', 'AmazonPay': 'AmazonPay', 'AIRTEL_MONEY': 'AIRTEL_MONEY', 'FreeCharge': 'FreeCharge', 'MobiKwik': 'MobiKwik', 'OLA': 'OLA', 'JioMoney': 'JioMoney', 'ZestMoney': 'ZestMoney', 'Instacred': 'Instacred', 'LazyPay': 'LazyPay', 'WALLET': 'WALLET', 'N/A': 'N/A' };

};

module.exports = new config();