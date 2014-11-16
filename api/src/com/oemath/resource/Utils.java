package com.oemath.resource;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Random;

import javax.script.ScriptException;

public class Utils {
    public static int rand(int n) {
        return Math.abs(new Random().nextInt()) % n;
    }
    
    
    public static <T> ArrayList<T> shuffle(List<T> list, int count) {
        int padding = count - list.size();
        for (int i=0; i<padding; i++) {
            list.add(list.get(i));
        }
        
        ArrayList<T> ret = new ArrayList<T>();
        for (int i=0; i<count; i++) {
            int j = i + rand(list.size() - i);
            ret.add(list.get(j));
            list.set(j, list.get(i));
        }
        
        return ret;
    }
    
    public static <T> boolean isEmpty(List<T> list) {
        return list == null || list.isEmpty();
    }

    
    public static boolean isEmpty(String str) {
        return str == null || str.isEmpty();
    }

    
    /*function replace_parameter(param, val_map) {
    $.each(val_map, function(k, v) {
        param = param.replace(new RegExp(k, "g"), v);
    });
    return param;
    }*/
    public static String replaceParameter(String value, HashMap<String,String> paramMap) {
        Iterator<Map.Entry<String,String>> it = paramMap.entrySet().iterator();
        while (it.hasNext()) {
            Map.Entry<String,String> entry = (Map.Entry<String,String>)it.next();
            value = value.replaceAll(entry.getKey(), entry.getValue());
        }
        return value;
    }
    

    /*    function parseParamMap(parameter) {
        var params = parameter.trim().split('$$');
        var pick_index = -1;
        var val_map = {};
        
        for (var i=0; i<params.length; i++) {
            var eql = params[i].indexOf('=');
            if (eql < 0) continue;

            var val_name = params[i].substr(0, eql).trim();
            var val_value = params[i].substr(eql+1).trim();

            var index_val = eval_rand_param(val_value, pick_index);
            pick_index = index_val[0];
            var param_eval = index_val[1];

            var param_exp = replace_parameter(param_eval, val_map).replace(/[\r\n]/g, '');
            try {
                param_val = eval(param_exp);
            }
            catch (e) {
                $("#test1").text("error:"+e);
            }
            val_map["<"+val_name+">"] = param_val;
        }

        return val_map;
    }
*/
    public static HashMap<String,String> parseParamMap(String parameter) {
        String[] params = parameter.trim().split("\\$\\$");
        int pickIndex = -1;
        HashMap<String,String> paramMap = new HashMap<String,String>();
        
        for (String param : params) {
            int eql = param.indexOf('=');
            if (eql < 0) {
                continue;
            }
            
            String valName = param.substring(0,  eql).trim();
            String valValue = param.substring(eql+1).trim();
            
            valValue = replaceParameter(valValue, paramMap).replaceAll("[\r\n]", "");
            ParseResult parseResult = evalRandParam(pickIndex, valValue);
            pickIndex = parseResult.index;
            
            String paramVal = null;
            try {
                Object evalRet = JEval.getEngine().eval(parseResult.value);
                if (evalRet instanceof Double) {
                    paramVal = String.valueOf(((Double)evalRet).intValue());
                }
                else {
                    paramVal = evalRet.toString();
                }
            }
            catch (ScriptException se) {

            }
            
            paramMap.put("<"+valName+">", paramVal);
        }

        return paramMap;
    }

    static class ParseResult {
        public int index;
        public String value;
    }
/*    function generate_val(param, pick_index) {
        if (param.indexOf('-') > 0) {
            // range
            var range = param.trim().split('-');
            var first = range[0] >> 0;
            var last = range[1] >> 0;
            var len = last - first + 1;
            return [pick_index, first + rand(len) >> 0];
        }
        else {
            // enum
            var params = param.trim().split(',');
            if (pick_index == -1) {
                pick_index = rand(params.length) >> 0;
            }
            return [pick_index, params[pick_index]];
        } 
    }
*/
    private static ParseResult generateRandomValue(int pickIndex, String value) {
        ParseResult ret = new ParseResult();
        
        if (value.indexOf('-') > 0) {
            // range
            String[] range = value.trim().split("-");
            int first = Integer.parseInt(range[0]);
            int last = Integer.parseInt(range[1]);
            ret.value = String.valueOf(first + rand(last - first + 1));
            ret.index = pickIndex;
        }
        else {
            // enum
            String[] params = value.trim().split(",");
            if (pickIndex == -1) {
                ret.index = rand(params.length);
            }
            else {
                ret.index = pickIndex;
            }
            ret.value = params[pickIndex];
        } 

        return ret;
    }

    
    /*function eval_rand_param(param, pick_index) {
        while (true) {
            var start = param.indexOf('{{');
            if (start < 0) break;
            
            var end = param.indexOf('}}', start+2);
            var rand_result = generate_val(param.substr(start+2, end-start-2), pick_index);
            pick_index = rand_result[0];
            param = param.substr(0, start) + rand_result[1] + param.substr(end+2);
        }
        
        return [pick_index, param];
    }*/
    private static ParseResult evalRandParam(int pickIndex, String param) {
        ParseResult ret = new ParseResult();
        
        while (true) {
            int start = param.indexOf("{{");
            if (start < 0) {
                break;
            }

            int end = param.indexOf("}}", start+2);
            ParseResult randResult = generateRandomValue(pickIndex, param.substring(start+2, end));
            pickIndex = randResult.index;
            param = param.substring(0, start) + randResult.value + param.substring(end+2);
        }
        
        ret.index = pickIndex;
        ret.value = param;
        return ret;
    }
    
}
