const express = require('express');
const router = express.Router();
const CustomizeLabel = require('../models/customize_label');

// Create or Update Customize Labels
router.post('/', async (req, res) => {
    const storeName = req.headers['store-name'];
    if (!storeName) {
        return res.status(400).send('Store name is required.');
    }

    const {
        customize_store_labels,
        store_information,
        billing_shipping_labels,
        product_items_labels,
        others_labels,
        footer_labels
    } = req.body;

    try {
        let label = await CustomizeLabel.findOne({ storeName });

        if (label) {
            // Update existing labels
            label.customize_store_labels = customize_store_labels;
            label.store_information = store_information;
            label.billing_shipping_labels = billing_shipping_labels;
            label.product_items_labels = product_items_labels;
            label.others_labels = others_labels;
            label.footer_labels = footer_labels;
        } else {
            // Create new labels
            label = new CustomizeLabel({
                storeName,
                customize_store_labels: customize_store_labels,
                store_information: store_information,
                billing_shipping_labels: billing_shipping_labels,
                product_items_labels: product_items_labels,
                others_labels: others_labels,
                footer_labels: footer_labels
            });
        }

        await label.save();

        res.status(200).json({
            message: 'Labels saved successfully',
            data: label
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/', async (req, res) => {
    const storeName = req.headers['store-name'];
    if (!storeName) {
        return res.status(400).send('Store name is required.');
    }

    try {
        const label = await CustomizeLabel.findOne({ storeName });
        if (!label) {
            return res.status(200).send({
                "message": "Labels saved successfully",
                "data": {
                    "storeName": "gst-virtue-paras.myshopify.com",
                    "customize_store_labels": {
                        "tax_invoice": "Tax Invoice",
                        "export_invoice": true,
                        "gstin": "GSTIN",
                        "is_gstin": true,
                        "iec_code": "IEC CODE",
                        "is_iec_code": true,
                        "cin": "CIN",
                        "is_cin": true,
                        "pan_no": "PAN NO.",
                        "is_pan_no": true,
                        "fssai_lic_no": "FSSAI LIC NO.",
                        "is_fssai_lic_no": true,
                        "invoice_no": "Invoice No",
                        "is_invoice_no": true,
                        "order_no": "Order No",
                        "is_order_no": true,
                        "invoice_date": "Invoice Date",
                        "is_invoice_date": true,
                        "order_date": "Order Date",
                        "is_order_date": true,
                        "transport_mode": "Transport Mode",
                        "is_transport_mode": true,
                        "date_of_supply": "Date of Supply",
                        "is_date_of_supply": true,
                        "place_of_supply": "Place of Supply",
                        "is_place_of_supply": true,
                        "original": "ORIGINAL"
                    },
                    "store_information": {
                        "company_legal_name": "",
                        "branch_name": "",
                        "shop_domain": "",
                        "is_shop_domain": true,
                        "store_address": "",
                        "contact_person": "",
                        "store_phone": "",
                        "store_email": "",
                        "terms_and_conditions": ""
                    },
                    "billing_shipping_labels": {
                        "bill_to_party": "BILL TO PARTY",
                        "ship_to_party": "SHIP TO PARTY / DELIVERY ADDRESS",
                        "billing_phone": "Phone",
                        "shipping_phone": "Phone",
                        "billing_gstin": "GSTIN",
                        "shipping_gstin": "GSTIN",
                        "hide_show_phone": true,
                        "hide_show_gstin": true,
                        "hide_show_customer_email": true,
                        "hide_show_shipping_section": true
                    },
                    "product_items_labels": {
                        "item_sku": "ITEM - SKU",
                        "hide_show_product_title": true,
                        "hide_show_product_sku": true,
                        "hide_show_product_hsn": true,
                        "hide_show_product_discount": true,
                        "qty": "QTY",
                        "rate_per_item": "RATE PER ITEM",
                        "discount_item": "DISCOUNT ITEM",
                        "texable_item": "TAXABLE ITEM",
                        "hsn": "HSN",
                        "gst": "GST",
                        "cgst_igst": "cgst-sgst",
                        "cgst": "CGST",
                        "igst": "IGST",
                        "sgst": "SGST",
                        "cess": "CESS",
                        "total": "TOTAL"
                    },
                    "others_labels": {
                        "payment_mode": "Payment Mode",
                        "is_payment_mode": true,
                        "order_note": "Order Note",
                        "is_order_note": true,
                        "term_and_conditions": "Terms and Conditions",
                        "is_term_and_conditions": true,
                        "total_invoice_amount_in_words": "Total Invoice Amount in Words",
                        "is_total_invoice_amount_in_words": true,
                        "e_and_o_e": "E. & O.E",
                        "this_is_a_computer_generated_invoice_and_does_not_require_a_signature": "This is a computer generated invoice and does not require a signature",
                        "hide_show_financial_status": true,
                        "hide_show_qr_code_image": true
                    },
                    "footer_labels": {
                        "thank_you_for_your_business": "Thank you for your business",
                        "is_thank_you_for_your_business": true,
                        "hide_show_generated_from": true,
                        "hide_show_page_no": true
                    },
                    "_id": "67b3025797e929c00f7b2c9e",
                    "__v": 0
                }
            });
        }

        res.status(200).json({
            message: 'Labels fetched successfully',
            data: label
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;