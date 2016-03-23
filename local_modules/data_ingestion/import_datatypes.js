// Data source format definition

module.exports.DataSource_formats = 
{
    CSV: "csv"
}

// See "import_MVP_DB_seed" for example of how to use all this

module.exports.DataSource_fieldValueDataTypeCoercion_operationsByName = // For convenience
{
    ProxyExisting: "ProxyExisting", // do nothing - "pass-through"
    ToInteger: "ToInteger",
    ToFloat: "ToFloat",
    ToDate: "ToDate"
}
//
module.exports.DataSource_fieldValueDataTypeCoercion_optionsPacksByNameByOperationName = // For convenience
{
    ToDate: {
        FourDigitYearOnly: {
            format: "YYYY"
        }
    }
}
//
//
//
//
var fieldValueDataTypeCoercion_coercionFunctionsByOperationName =  // Private for now
{ // Note: We're assuming all in-values will be strings, so these are inStrings rather than inValues
    ProxyExisting: function(inString, options) 
    {
        return inString
    },
    ToInteger: function(inString, options) 
    {
        var parsedValue = parseInt(inString)
        // console.log("The int is", parsedValue)
        
        return parsedValue
    },
    ToFloat: function(inString, options) 
    {
        var parsedValue = parseFloat(inString)
        // console.log("The float is", parsedValue)
        
        return parsedValue
    },
    ToDate: function(inString, options)
    { // -> new Date
        // Now verify date string..
        if (inString == "") { // no actual date
            return undefined
        }
        if (inString == "Unknown" || inString == "unknown" 
            || inString == "Unkown" || inString == "unkown"
        || inString == "Various" || inString == "various"
        || inString == "N/A" || inString == "n/a") { // defined as not defined
            return undefined
        }
        if (inString == "n.d." 
            || inString == "n.d"
        || inString == "(n.d.)"
        || inString == "n. d."
        || inString == "no date") { // null as in 'none'
            return null
        }
        // Now verify date parsing format string    
        var dateFormatString = options.format
        if (dateFormatString == "" || dateFormatString == null || typeof dateFormatString === 'undefined') {
            console.error("❌  No format string with which to derive formatted date \"" + inString + "\". Returning undefined.")
            
            return undefined
        }
        // Instantiate and configure fresh moment module
        var moment = require("moment") // note, var not const as we're potentially replacing the parse two digit year method here every time
        var replacement_parseTwoDigitYear_fn = options.replacement_parseTwoDigitYear_fn
        if (replacement_parseTwoDigitYear_fn != null && typeof replacement_parseTwoDigitYear_fn !== 'undefined') {
            moment.parseTwoDigitYear = replacement_parseTwoDigitYear_fn
        }
        // Parse
        var aMoment = moment(inString, dateFormatString)
        if (aMoment.isValid() == false) {
            console.error("❌  The date \"" + inString + "\" cannot be parsed with the format string \"" + dateFormatString + "\". Returning null.")
            
            return null
        }
        var parsedValue = aMoment.toDate()
        // console.log("The date is", parsedValue)
        
        return parsedValue
    }
}
//
// Public: 
module.exports.NewDataTypeCoercedValue = function(coercionSchemeForKey, rowValue)
{
    var operationName = coercionSchemeForKey.do
    if (operationName == null || operationName == "" || typeof operationName === 'undefined') {
        console.error("❌  Illegal, malformed, or missing operation name at key 'do' in coercion scheme."
                        + " Returning undefined.\ncoercionSchemeForKey:\n"
                        , coercionSchemeForKey)
        
        return undefined
    }
    var operationOptions = coercionSchemeForKey.opts
    var operationFn = fieldValueDataTypeCoercion_coercionFunctionsByOperationName[operationName]
    var coercedValue = operationFn(rowValue, operationOptions)
    
    return coercedValue
}