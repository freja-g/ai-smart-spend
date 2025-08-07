-- Fix function search path security issues
CREATE OR REPLACE FUNCTION public.create_budget_alert_notification(
  p_user_id UUID,
  p_category TEXT,
  p_spent_amount NUMERIC,
  p_budget_amount NUMERIC
) RETURNS VOID 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (
    p_user_id,
    'Budget Alert',
    'You have spent $' || p_spent_amount || ' out of $' || p_budget_amount || ' for ' || p_category,
    'warning'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.create_savings_goal_notification(
  p_user_id UUID,
  p_goal_name TEXT,
  p_current_amount NUMERIC,
  p_target_amount NUMERIC
) RETURNS VOID 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  progress_percentage NUMERIC;
BEGIN
  progress_percentage := (p_current_amount / p_target_amount) * 100;
  
  IF progress_percentage >= 100 THEN
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (
      p_user_id,
      'Goal Achieved!',
      'Congratulations! You have reached your goal: ' || p_goal_name,
      'success'
    );
  ELSIF progress_percentage >= 75 THEN
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (
      p_user_id,
      'Goal Progress',
      'You are ' || ROUND(progress_percentage, 1) || '% towards your goal: ' || p_goal_name,
      'info'
    );
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_budget_alert()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if spent amount exceeds 80% of budget
  IF NEW.spent_amount > (NEW.budgeted_amount * 0.8) THEN
    PERFORM public.create_budget_alert_notification(
      NEW.user_id,
      NEW.category,
      NEW.spent_amount,
      NEW.budgeted_amount
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_savings_goal_progress()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.create_savings_goal_notification(
    NEW.user_id,
    NEW.name,
    NEW.current_amount,
    NEW.target_amount
  );
  
  RETURN NEW;
END;
$$;