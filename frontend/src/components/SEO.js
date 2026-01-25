import { Helmet } from 'react-helmet-async';

/**
 * SEO Component for page-specific meta tags
 * Usage: <SEO title="Page Title" description="Page description" canonical="/page-path" />
 */
const SEO = ({
    title = 'Spencer Green Hotel Batu | Hotel Eco Friendly di Batu Malang',
    description = 'Spencer Green Hotel Batu adalah hotel eco-friendly di Batu Malang dengan kolam renang outdoor, rooftop cafe, dan pemandangan pegunungan.',
    keywords = 'hotel batu, hotel batu malang, spencer green hotel, hotel eco friendly batu',
    canonical = '/',
    ogImage = 'https://spencergreenhotel.com/images/home-cover.jpg',
    ogType = 'website'
}) => {
    const baseUrl = 'https://spencergreenhotel.com';
    const fullCanonical = `${baseUrl}${canonical}`;

    return (
        <Helmet>
            <title>{title}</title>
            <meta name="description" content={description} />
            <meta name="keywords" content={keywords} />
            <link rel="canonical" href={fullCanonical} />

            {/* Open Graph */}
            <meta property="og:title" content={title} />
            <meta property="og:description" content={description} />
            <meta property="og:url" content={fullCanonical} />
            <meta property="og:image" content={ogImage} />
            <meta property="og:type" content={ogType} />

            {/* Twitter */}
            <meta name="twitter:title" content={title} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={ogImage} />
        </Helmet>
    );
};

export default SEO;
