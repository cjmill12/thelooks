const { createClient } = require('@supabase/supabase-js');

// These are pulled automatically from your Netlify Environment Variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async (event) => {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const body = JSON.parse(event.body);
        
        // Insert the booking into your 'bookings' table
        const { data, error } = await supabase
            .from('bookings')
            .insert([
                {
                    client_name: body.name,
                    client_email: body.email,
                    booking_date: body.date,
                    booking_time: body.time,
                    style_label: body.style,
                    image_url: body.image,
                    shop_id: 'pilot-shop-01' // Identifying your first partner
                }
            ]);

        if (error) throw error;

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Booking saved successfully!", data })
        };

    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
