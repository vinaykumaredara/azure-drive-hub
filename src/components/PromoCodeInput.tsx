import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tag, Gift, Check, X, Loader2, AlertCircle, Percent, IndianRupee } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from '@/hooks/use-toast';

interface PromoCodeInputProps {
  onPromoApplied: (discount: number, code: string, discountType?: 'percent' | 'flat') => void;
  onPromoRemoved: () => void;
  totalAmount: number;
  className?: string;
}

interface PromoCode {
  id: string;
  code: string;
  discount_percent?: number;
  discount_flat?: number;
  valid_from?: string;
  valid_to?: string;
  active: boolean;
  usage_limit?: number;
  times_used?: number;
}

interface PromoValidation {
  valid: boolean;
  message: string;
  discount_percent?: number;
  discount_flat?: number;
}

export const PromoCodeInput: React.FC<PromoCodeInputProps> = ({
  onPromoApplied,
  onPromoRemoved,
  totalAmount,
  className = "",
}) => {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{code: string, discount: number, type: 'percent' | 'flat'} | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [availablePromos, setAvailablePromos] = useState<PromoCode[]>([]);
  const [isLoadingPromos, setIsLoadingPromos] = useState(false);

  // Fetch available promo codes
  const fetchAvailablePromos = async () => {
    try {
      setIsLoadingPromos(true);
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('active', true)
        .limit(5)
        .order('created_at', { ascending: false });

      if (error) {throw error;}
      
      // Filter valid promo codes
      const now = new Date();
      const validPromos = ((data as any) || []).filter((promo: any) => {
        if (promo.valid_to && new Date(promo.valid_to) < now) {return false;}
        if (promo.valid_from && new Date(promo.valid_from) > now) {return false;}
        if (promo.usage_limit && promo.times_used >= promo.usage_limit) {return false;}
        return true;
      });

      setAvailablePromos(validPromos);
    } catch (error) {
      console.error('Error fetching promo codes:', error);
    } finally {
      setIsLoadingPromos(false);
    }
  };

  useEffect(() => {
    if (isExpanded && !availablePromos.length) {
      fetchAvailablePromos();
    }
  }, [isExpanded]);

  const validatePromoCode = async (code: string): Promise<PromoValidation> => {
    try {
      const { data, error } = await (supabase.rpc as any)('validate_promo_code', {
        code_input: code.toUpperCase()
      });

      if (error) {
        console.error('RPC Error:', error);
        throw error;
      }

      console.log('RPC Response:', data);
      
      // The RPC function returns an array of records
      if (data && Array.isArray(data) && (data as any).length > 0) {
        const result = (data as any)[0];
        return {
          valid: (result as any).valid,
          message: (result as any).message,
          discount_percent: (result as any).discount_percent,
          discount_flat: (result as any).discount_flat
        };
      }
      
      return { valid: false, message: 'Invalid promo code' };
    } catch (error) {
      console.error('Error validating promo code:', error);
      return { valid: false, message: 'Failed to validate promo code' };
    }
  };

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) {return;}
    
    setIsValidating(true);
    setValidationError(null);

    try {
      const validation = await validatePromoCode(promoCode.trim());
      
      if (validation.valid) {
        const discountAmount = validation.discount_percent 
          ? (totalAmount * validation.discount_percent / 100)
          : (validation.discount_flat || 0);
        
        const discountType = validation.discount_percent ? 'percent' : 'flat';
        
        setAppliedPromo({
          code: promoCode.toUpperCase(),
          discount: discountAmount,
          type: discountType
        });
        
        onPromoApplied(discountAmount, promoCode.toUpperCase(), discountType);
        
        toast({
          title: "Promo Code Applied!",
          description: `You saved ₹${discountAmount.toFixed(2)} with code ${promoCode.toUpperCase()}`,
        });
        
        setPromoCode('');
        setIsExpanded(false);
      } else {
        setValidationError(validation.message);
        toast({
          title: "Invalid Promo Code",
          description: validation.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      setValidationError('Failed to apply promo code');
    } finally {
      setIsValidating(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    onPromoRemoved();
    toast({
      title: "Promo Code Removed",
      description: "Promo code discount has been removed",
    });
  };

  const applyQuickPromo = async (promo: PromoCode) => {
    setPromoCode(promo.code);
    await handleApplyPromo();
  };

  const getDiscountText = (promo: PromoCode) => {
    if (promo.discount_percent) {
      return `${promo.discount_percent}% OFF`;
    } else if (promo.discount_flat) {
      return `₹${promo.discount_flat} OFF`;
    }
    return 'DISCOUNT';
  };

  const getDiscountColor = (promo: PromoCode) => {
    if (promo.discount_percent && promo.discount_percent >= 50) {return 'bg-red-100 text-red-700 border-red-200';}
    if (promo.discount_percent && promo.discount_percent >= 25) {return 'bg-orange-100 text-orange-700 border-orange-200';}
    if (promo.discount_flat && promo.discount_flat >= 500) {return 'bg-red-100 text-red-700 border-red-200';}
    if (promo.discount_flat && promo.discount_flat >= 200) {return 'bg-orange-100 text-orange-700 border-orange-200';}
    return 'bg-green-100 text-green-700 border-green-200';
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Applied Promo Display */}
      {appliedPromo && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-3 bg-green-50 border border-green-200 rounded-lg"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium text-green-800">
                  Code "{appliedPromo.code}" Applied
                </p>
                <p className="text-sm text-green-600">
                  You saved ₹{appliedPromo.discount.toFixed(2)}
                  {appliedPromo.type === 'percent' && (
                    <span className="ml-1">
                      ({((appliedPromo.discount / totalAmount) * 100).toFixed(0)}% off)
                    </span>
                  )}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemovePromo}
              className="text-green-600 hover:text-green-700 hover:bg-green-100"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>
      )}

      {/* Promo Code Toggle */}
      {!appliedPromo && (
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-primary hover:text-primary-foreground hover:bg-primary p-0 h-auto font-normal"
          >
            <Gift className="w-4 h-4 mr-2" />
            Have a promo code?
          </Button>
          {!isExpanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-muted-foreground"
            >
              Click to apply discount
            </motion.div>
          )}
        </div>
      )}

      {/* Expanded Promo Input */}
      <AnimatePresence>
        {isExpanded && !appliedPromo && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <Card className="border border-dashed border-primary/30">
              <CardContent className="p-4 space-y-4">
                {/* Available Promo Codes */}
                {availablePromos.length > 0 && (
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-muted-foreground">
                      Available Promo Codes
                    </Label>
                    <div className="space-y-2">
                      {availablePromos.slice(0, 3).map((promo) => (
                        <motion.div
                          key={promo.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`p-3 border rounded-lg cursor-pointer transition-all ${getDiscountColor(promo)} hover:shadow-sm`}
                          onClick={() => applyQuickPromo(promo)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1">
                                {promo.discount_percent ? (
                                  <Percent className="w-4 h-4" />
                                ) : (
                                  <IndianRupee className="w-4 h-4" />
                                )}
                                <span className="font-mono font-bold text-sm">
                                  {promo.code}
                                </span>
                              </div>
                              <Badge variant="secondary" className="text-xs">
                                {getDiscountText(promo)}
                              </Badge>
                            </div>
                            <Button size="sm" variant="ghost" className="h-6 px-2 text-xs">
                              Apply
                            </Button>
                          </div>
                          {promo.usage_limit && (
                            <p className="text-xs mt-1 opacity-75">
                              {promo.usage_limit - (promo.times_used || 0)} uses left
                            </p>
                          )}
                        </motion.div>
                      ))}
                    </div>
                    <Separator />
                  </div>
                )}

                {/* Manual Promo Code Input */}
                <div className="space-y-3">
                  <Label htmlFor="promo-input" className="text-sm font-medium">
                    Enter Promo Code
                  </Label>
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="promo-input"
                        placeholder="FIRST50"
                        value={promoCode}
                        onChange={(e) => {
                          setPromoCode(e.target.value.toUpperCase());
                          setValidationError(null);
                        }}
                        className="pl-10 uppercase"
                        disabled={isValidating}
                      />
                    </div>
                    <Button
                      onClick={handleApplyPromo}
                      disabled={!promoCode.trim() || isValidating}
                      className="min-w-[80px]"
                    >
                      {isValidating ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Apply'
                      )}
                    </Button>
                  </div>

                  {validationError && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 text-sm text-red-600"
                    >
                      <AlertCircle className="w-4 h-4" />
                      {validationError}
                    </motion.div>
                  )}
                </div>

                <div className="flex justify-between items-center pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsExpanded(false)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Cancel
                  </Button>
                  {isLoadingPromos && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Loading offers...
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};